import duckdb,json
con=duckdb.connect('spike.duckdb')
con.execute("ATTACH 'usda.duckdb' AS u (READ_ONLY)")
Q=lambda s: con.execute(s).fetchall()

# total rows in the OFF file (for the ignore_errors loss check)
print("OFF csv rows (all countries):",Q("select count(*) from read_csv('off.csv.gz', delim='\t', header=true, quote='', all_varchar=true, ignore_errors=true, sample_size=-1)"))

# normalized gtin + check digit helper as SQL macros
con.execute("""
CREATE OR REPLACE MACRO g14(c) AS lpad(regexp_replace(coalesce(c,''),'[^0-9]','','g'),14,'0');
CREATE OR REPLACE MACRO gvalid(c) AS (
  length(regexp_replace(coalesce(c,''),'[^0-9]','','g')) BETWEEN 8 AND 14 AND
  (10 - (list_sum(list_transform(range(1,14), i -> CAST(substr(g14(c),i,1) AS INTEGER) * CASE WHEN i % 2 = 1 THEN 3 ELSE 1 END)) % 10)) % 10
   = CAST(substr(g14(c),14,1) AS INTEGER));
CREATE OR REPLACE MACRO agrees(k,p,c,f,fi,al) AS (
  list_bool_or(list_transform([p*4+c*4+f*9+7*al, p*4+c*4+f*9+7*al-2*fi, p*4+c*4+f*9+7*al+2*fi], v -> abs(k - v) <= greatest(0.15*v, 20.0))));
CREATE OR REPLACE MACRO problem(nm,k,p,c,f,fi,al) AS (
  CASE WHEN nm IS NULL OR trim(nm)='' THEN 'missingName'
       WHEN k IS NULL OR p IS NULL OR c IS NULL OR f IS NULL THEN 'missingValue'
       WHEN least(k,p,c,f,coalesce(fi,0),coalesce(al,0)) < 0 THEN 'negativeValue'
       WHEN p+c+f > 100 THEN 'macrosExceed100g'
       WHEN k > 900 THEN 'energyTooHigh'
       WHEN NOT agrees(k,p,c,f,coalesce(fi,0),coalesce(al,0)) THEN 'energyDisagrees'
       ELSE NULL END);
""")
con.execute("""CREATE OR REPLACE TABLE off AS SELECT code, g14(code) gtin, gvalid(code) gok, product_name AS nm, brands brand, kcal, protein, carbs, fat, fiber, sodium_mg, alcohol,
  problem(product_name,kcal,protein,carbs,fat,fiber,alcohol) prob FROM off_raw""")
con.execute("""CREATE OR REPLACE TABLE us AS SELECT fdc_id, g14(gtin_upc) gtin, gvalid(gtin_upc) gok, description AS nm, brand_owner brand, kcal, protein, carbs, fat, fiber, alcohol,
  problem(description,kcal,protein,carbs,fat,fiber,alcohol) prob, discontinued_date FROM u.usda""")

print("Q1 OFF US total, with barcode, valid gtin, 4 macros, 4 macros+valid:")
print(Q("select count(*), count_if(code<>''), count_if(gok), count_if(kcal is not null and protein is not null and carbs is not null and fat is not null), count_if(gok and prob is null) from off"))
print("Q2 USDA branded rows, distinct gtin, valid gtin distinct:")
print(Q("select count(*), count(distinct gtin), count(distinct case when gok then gtin end) from us"))
print("  usda distinct valid gtin passing checks:", Q("select count(distinct gtin) from us where gok and prob is null"))
print("  overlap OFF(valid, any) x USDA(valid, any):", Q("select count(distinct o.gtin) from off o join us u using (gtin) where o.gok"))
print("  overlap both pass checks:", Q("select count(distinct o.gtin) from off o join us u using (gtin) where o.gok and o.prob is null and u.prob is null"))
print("Q4 failure shares (reason):")
print("  OFF:",Q("select coalesce(prob,'valid') p, count(*), round(100.0*count(*)/(select count(*) from off),1) from off group by 1 order by 2 desc"))
print("  USDA:",Q("select coalesce(prob,'valid') p, count(*), round(100.0*count(*)/(select count(*) from us),1) from us group by 1 order by 2 desc"))
# Q3 disagreements: one row per gtin per source (latest USDA = max fdc_id); both with 4 macros
con.execute("""CREATE OR REPLACE TABLE ob AS SELECT * FROM (SELECT *, row_number() over (partition by gtin order by code) rn FROM off WHERE gok AND kcal IS NOT NULL AND protein IS NOT NULL AND carbs IS NOT NULL AND fat IS NOT NULL) WHERE rn=1""")
con.execute("""CREATE OR REPLACE TABLE ub AS SELECT * FROM (SELECT *, row_number() over (partition by gtin order by try_cast(fdc_id AS BIGINT) desc) rn FROM us WHERE gok AND kcal IS NOT NULL AND protein IS NOT NULL AND carbs IS NOT NULL AND fat IS NOT NULL) WHERE rn=1""")
con.execute("""CREATE OR REPLACE TABLE both_ AS
SELECT o.gtin, o.nm oname, u.nm uname, o.brand obrand, u.brand ubrand,
 o.kcal ok, u.kcal uk, o.protein op, u.protein up, o.carbs oc, u.carbs uc, o.fat of_, u.fat uf, o.prob oprob, u.prob uprob,
 abs(o.kcal-u.kcal) > greatest(0.10*greatest(o.kcal,u.kcal), 10) kdis,
 (abs(o.protein-u.protein) > greatest(0.10*greatest(o.protein,u.protein), 1.0)
  OR abs(o.carbs-u.carbs) > greatest(0.10*greatest(o.carbs,u.carbs), 1.0)
  OR abs(o.fat-u.fat) > greatest(0.10*greatest(o.fat,u.fat), 1.0)) mdis
FROM ob o JOIN ub u USING (gtin)""")
print("Q3 pairs with both macros:", Q("select count(*), count_if(kdis), count_if(mdis), count_if(kdis or mdis) from both_"))
print("  among disagreeing (kcal or macros): OFF passes/fails vs USDA passes/fails")
print(Q("select (oprob is null) off_ok, (uprob is null) usda_ok, count(*) from both_ where kdis or mdis group by 1,2 order by 1,2"))
print("  among ALL pairs the same split:", Q("select (oprob is null) off_ok, (uprob is null) usda_ok, count(*) from both_ group by 1,2 order by 1,2"))
con.execute("COPY (select * from both_ where kdis or mdis using sample 50 rows (reservoir, 20261009)) TO 'sample50_disagreements.csv' (HEADER)")
