import duckdb,time
t=time.time()
con=duckdb.connect('usda.duckdb')
B='branded_food_csv_2025-04-24/FoodData_Central_branded_food_csv_2025-04-24'
con.execute(f"""
CREATE OR REPLACE TABLE bf AS SELECT fdc_id, brand_owner, brand_name, gtin_upc, serving_size, serving_size_unit, household_serving_fulltext, branded_food_category, market_country, discontinued_date
 FROM read_csv('{B}/branded_food.csv', header=true, all_varchar=true, ignore_errors=true)""")
con.execute(f"""CREATE OR REPLACE TABLE fd AS SELECT fdc_id, description FROM read_csv('{B}/food.csv', header=true, all_varchar=true, ignore_errors=true)""")
con.execute(f"""
CREATE OR REPLACE TABLE fn AS
SELECT fdc_id,
  max(CASE WHEN nutrient_id='1008' THEN try_cast(amount AS DOUBLE) END) kcal,
  max(CASE WHEN nutrient_id='1003' THEN try_cast(amount AS DOUBLE) END) protein,
  max(CASE WHEN nutrient_id='1005' THEN try_cast(amount AS DOUBLE) END) carbs,
  max(CASE WHEN nutrient_id='1004' THEN try_cast(amount AS DOUBLE) END) fat,
  max(CASE WHEN nutrient_id='1079' THEN try_cast(amount AS DOUBLE) END) fiber,
  max(CASE WHEN nutrient_id='1018' THEN try_cast(amount AS DOUBLE) END) alcohol
FROM read_csv('{B}/food_nutrient.csv', header=true, all_varchar=true, ignore_errors=true)
WHERE nutrient_id IN ('1008','1003','1005','1004','1079','1018')
GROUP BY fdc_id""")
con.execute("""CREATE OR REPLACE TABLE usda AS
SELECT bf.*, fd.description, fn.kcal, fn.protein, fn.carbs, fn.fat, fn.fiber, fn.alcohol
FROM bf LEFT JOIN fd USING (fdc_id) LEFT JOIN fn USING (fdc_id)""")
print(con.execute("select count(*), count(DISTINCT gtin_upc), count_if(gtin_upc is not null and gtin_upc<>''), count_if(kcal is not null and protein is not null and carbs is not null and fat is not null), count_if(market_country='United States') from usda").fetchall())
print(round(time.time()-t))
