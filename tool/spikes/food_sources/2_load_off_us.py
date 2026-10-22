import duckdb,time
t=time.time()
con=duckdb.connect('spike.duckdb')
con.execute("""
CREATE OR REPLACE TABLE off_raw AS
SELECT code, product_name, brands, countries_tags, serving_size, serving_quantity,
  try_cast("energy-kcal_100g" AS DOUBLE) kcal, try_cast(proteins_100g AS DOUBLE) protein,
  try_cast(carbohydrates_100g AS DOUBLE) carbs, try_cast(fat_100g AS DOUBLE) fat,
  try_cast(fiber_100g AS DOUBLE) fiber, try_cast(sodium_100g AS DOUBLE)*1000 sodium_mg,
  try_cast(alcohol_100g AS DOUBLE) alcohol
FROM read_csv('off.csv.gz', delim='\t', header=true, quote='', all_varchar=true, ignore_errors=true, sample_size=-1)
WHERE countries_tags LIKE '%en:united-states%'
""")
print(con.execute("select count(*) from off_raw").fetchone(), round(time.time()-t))
