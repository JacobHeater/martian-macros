import duckdb,sqlite3,re,os,gzip,lzma,shutil,time
con=duckdb.connect('spike.duckdb')
con.execute("ATTACH 'usda.duckdb' AS u (READ_ONLY)")
src=open(os.path.join(os.environ.get('MM_REPO','.'),'packages','food_catalog','lib','src','food_pack_format.dart'),encoding='utf-8').read()
schema=re.search(r"schema = '''(.*?)'''",src,re.S).group(1)

def build(path, rows, servings):
    if os.path.exists(path): os.remove(path)
    db=sqlite3.connect(path)
    db.executescript(schema)
    for k,v in [('pack_id','spike'),('built_on','2026-10-09'),('region','US'),('sources','[]'),('license','spike'),('attribution','spike')]:
        db.execute("insert into header values (?,?)",(k,v))
    S=lambda v: None if v is None else int(round(v*100))
    for i,(nm,br,k,p,c,f,fi,na,al,g) in enumerate(rows,1):
        db.execute("insert into foods values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(i,nm,br,S(k),S(p),S(c),S(f),S(fi),S(na),S(al),0,None,None,'s',1,'spike'))
        if g: db.execute("insert into barcodes values (?,?)",(g,i))
        sv=servings.get(i)
        if sv: db.execute("insert into servings values (?,?,?)",(i,sv[0],S(sv[1])))
    db.execute("insert into foods_fts(foods_fts) values ('rebuild')")
    db.commit(); db.execute("pragma user_version=1"); db.execute("vacuum"); db.close()
    return os.path.getsize(path)
def sizes(path):
    raw=os.path.getsize(path)
    t=time.time()
    with open(path,'rb') as f: data=f.read()
    gz=len(gzip.compress(data,9)); xz=len(lzma.compress(data,preset=6))
    return raw,gz,xz

# barcode pack: valid-gtin foods passing MM-53, one per gtin (USDA newest, else OFF)
rows=con.execute("""
WITH uu AS (SELECT * FROM (SELECT *, row_number() over (partition by gtin order by try_cast(fdc_id AS BIGINT) desc) rn FROM us WHERE gok AND prob IS NULL) WHERE rn=1),
oo AS (SELECT * FROM (SELECT *, row_number() over (partition by gtin order by code) rn FROM off WHERE gok AND prob IS NULL) WHERE rn=1),
m AS (SELECT gtin, nm, brand, kcal, protein, carbs, fat, fiber, NULL::DOUBLE sodium_mg, alcohol, 'usda' src FROM uu
      UNION ALL SELECT gtin, nm, brand, kcal, protein, carbs, fat, fiber, sodium_mg, alcohol, 'off' FROM oo WHERE gtin NOT IN (SELECT gtin FROM uu))
SELECT nm, brand, kcal, protein, carbs, fat, fiber, sodium_mg, alcohol, gtin, src FROM m""").fetchall()
print("barcode pack foods:",len(rows), "from usda:",sum(1 for r in rows if r[10]=='usda'), "from off only:",sum(1 for r in rows if r[10]=='off'))
t=time.time()
path='pack_barcode.db'
build(path,[r[:10] for r in rows],{})
print("barcode pack, no servings: raw/gzip/xz bytes",sizes(path), "build s",round(time.time()-t))
print("with search index; sample search time:")
db=sqlite3.connect(path)
t=time.time(); n=len(db.execute("select f.id from foods_fts join foods f on f.id=foods_fts.rowid where foods_fts match '\"chick\"* \"brea\"*' order by bm25(foods_fts,10.0,1.0) limit 25").fetchall()); print(" search two prefixes:",n,"rows",round((time.time()-t)*1000,1),"ms")
g=db.execute("select gtin from barcodes limit 1 offset 200000").fetchone()[0]
t=time.time(); db.execute("select f.id from barcodes b join foods f on f.id=b.food_id where gtin=?",(g,)).fetchall(); print(" barcode lookup:",round((time.time()-t)*1000,2),"ms")
db.close()

# generic pack: Foundation + SR Legacy
tot=0; gen=[]
for tag,d in [('foundation','foundation_food_csv_2025-04-24/FoodData_Central_foundation_food_csv_2025-04-24'),('sr_legacy','sr_legacy_food_csv_2018-04/FoodData_Central_sr_legacy_food_csv_2018-04')]:
    con.execute(f"""CREATE OR REPLACE TABLE fdn_{tag} AS
    WITH fd AS (SELECT fdc_id, description FROM read_csv('{d}/food.csv', header=true, all_varchar=true, ignore_errors=true)),
    fn AS (SELECT fdc_id,
      max(CASE WHEN nutrient_id='1008' THEN try_cast(amount AS DOUBLE) END) kcal,
      max(CASE WHEN nutrient_id IN ('2047','2048') THEN try_cast(amount AS DOUBLE) END) kcal_atwater,
      max(CASE WHEN nutrient_id='1003' THEN try_cast(amount AS DOUBLE) END) protein,
      max(CASE WHEN nutrient_id='1005' THEN try_cast(amount AS DOUBLE) END) carbs,
      max(CASE WHEN nutrient_id='1004' THEN try_cast(amount AS DOUBLE) END) fat,
      max(CASE WHEN nutrient_id='1079' THEN try_cast(amount AS DOUBLE) END) fiber,
      max(CASE WHEN nutrient_id='1018' THEN try_cast(amount AS DOUBLE) END) alcohol
      FROM read_csv('{d}/food_nutrient.csv', header=true, all_varchar=true, ignore_errors=true) GROUP BY fdc_id)
    SELECT fd.description AS nm, coalesce(kcal,kcal_atwater) kcal, protein, carbs, fat, fiber, alcohol FROM fd JOIN fn USING (fdc_id)""")
    c=con.execute(f"select count(*), count_if(kcal is not null and protein is not null and carbs is not null and fat is not null) from fdn_{tag}").fetchone()
    print(tag,"foods, with 4 macros:",c)
con.execute("""CREATE OR REPLACE TABLE gen AS SELECT *, problem(nm,kcal,protein,carbs,fat,fiber,alcohol) prob FROM (SELECT * FROM fdn_foundation UNION ALL SELECT * FROM fdn_sr_legacy)""")
print("generic: total, pass checks:",con.execute("select count(*), count_if(prob is null) from gen").fetchone(), con.execute("select coalesce(prob,'valid'), count(*) from gen group by 1").fetchall())
grows=con.execute("select nm, NULL, kcal, protein, carbs, fat, fiber, NULL, alcohol, NULL from gen where prob is null").fetchall()
build('pack_generic.db',grows,{})
print("generic pack raw/gzip/xz bytes:",sizes('pack_generic.db'))
