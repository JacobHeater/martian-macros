-- MM-52: maps each source onto one schema and writes {{out}}/candidates.csv.
-- Run by `mm food build` with the DuckDB command-line tool; {{cache}} and
-- {{out}} are replaced with folder paths. No checks happen here beyond reading:
-- the nutrition rules, barcode normalization and conflict handling are Dart
-- (src/domain and src/foodPipeline), so there is one implementation.
--
-- Columns: source, source_id, kind, name, brand, gtin, kcal, protein, carbs,
-- fat, fiber, sodium_mg, alcohol, then the MM-307 micronutrients (potassium_mg,
-- calcium_mg, iron_mg, magnesium_mg, zinc_mg, vitamin_a_ug, vitamin_c_mg,
-- vitamin_d_ug, vitamin_b12_ug, folate_ug, sugars_g, saturated_fat_g,
-- cholesterol_mg; Open Food Facts states grams, converted here), servings (JSON [{"d": text, "g": grams}]),
-- version_key (orders versions of one product within a source; highest wins),
-- updated_at (when the source last changed the record, seconds since 1970).
-- The barcode file adds sugar_alcohols (USDA Branded's nutrient 1086, Open
-- Food Facts' polyols_100g; MM-397) and carbs_label: 'us' where the
-- carbohydrate is surely a US label's total, 'unknown' for an Open Food Facts
-- product also sold outside the US and Canada, whose figure may be an EU
-- label's available carbohydrate (the panel's NU-1; usLabelCarbs decides).
-- Both files end with category (MM-616): the source's own category, which
-- foodGroupTable maps to a food group: USDA Branded's branded_food_category,
-- Foundation's and SR Legacy's food_category, FNDDS's WWEIA category; empty
-- for Open Food Facts; then basis (MM-650): 'g' when the nutrients are per
-- 100 g, 'ml' for a liquid stated per 100 mL (a USDA Branded row whose
-- serving unit is ml or MLT; an Open Food Facts product whose serving text
-- states a number of millilitres). A serving is then {"d": text, "ml": mL}.
-- All nutrients are per 100 g, or per 100 mL where basis is 'ml'.

COPY (
  -- USDA Branded Foods: United States, one row per version of each product.
  WITH nut AS (
    SELECT fdc_id,
      max(CASE WHEN nutrient_id = '1008' THEN try_cast(amount AS DOUBLE) END) AS kcal,
      max(CASE WHEN nutrient_id = '1003' THEN try_cast(amount AS DOUBLE) END) AS protein,
      max(CASE WHEN nutrient_id = '1005' THEN try_cast(amount AS DOUBLE) END) AS carbs,
      max(CASE WHEN nutrient_id = '1004' THEN try_cast(amount AS DOUBLE) END) AS fat,
      max(CASE WHEN nutrient_id = '1079' THEN try_cast(amount AS DOUBLE) END) AS fiber,
      max(CASE WHEN nutrient_id = '1093' THEN try_cast(amount AS DOUBLE) END) AS sodium_mg,
      max(CASE WHEN nutrient_id = '1018' THEN try_cast(amount AS DOUBLE) END) AS alcohol,
      max(CASE WHEN nutrient_id = '1092' THEN try_cast(amount AS DOUBLE) END) AS potassium_mg,
      max(CASE WHEN nutrient_id = '1087' THEN try_cast(amount AS DOUBLE) END) AS calcium_mg,
      max(CASE WHEN nutrient_id = '1089' THEN try_cast(amount AS DOUBLE) END) AS iron_mg,
      max(CASE WHEN nutrient_id = '1090' THEN try_cast(amount AS DOUBLE) END) AS magnesium_mg,
      max(CASE WHEN nutrient_id = '1095' THEN try_cast(amount AS DOUBLE) END) AS zinc_mg,
      max(CASE WHEN nutrient_id = '1106' THEN try_cast(amount AS DOUBLE) END) AS vitamin_a_ug,
      max(CASE WHEN nutrient_id = '1162' THEN try_cast(amount AS DOUBLE) END) AS vitamin_c_mg,
      max(CASE WHEN nutrient_id = '1114' THEN try_cast(amount AS DOUBLE) END) AS vitamin_d_ug,
      max(CASE WHEN nutrient_id = '1110' THEN try_cast(amount AS DOUBLE) END) AS vitamin_d_iu,
      max(CASE WHEN nutrient_id = '1178' THEN try_cast(amount AS DOUBLE) END) AS vitamin_b12_ug,
      max(CASE WHEN nutrient_id = '1190' THEN try_cast(amount AS DOUBLE) END) AS folate_ug,
      max(CASE WHEN nutrient_id = '2000' THEN try_cast(amount AS DOUBLE) END) AS sugars_g,
      max(CASE WHEN nutrient_id = '1063' THEN try_cast(amount AS DOUBLE) END) AS sugars_nlea_g,
      max(CASE WHEN nutrient_id = '1258' THEN try_cast(amount AS DOUBLE) END) AS saturated_fat_g,
      max(CASE WHEN nutrient_id = '1086' THEN try_cast(amount AS DOUBLE) END) AS sugar_alcohols,
      max(CASE WHEN nutrient_id = '1253' THEN try_cast(amount AS DOUBLE) END) AS cholesterol_mg
    FROM read_csv('{{cache}}/usda_branded/food_nutrient.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE nutrient_id IN ('1086', '1008', '1003', '1005', '1004', '1079', '1093', '1018',
                          '1092', '1087', '1089', '1090', '1095', '1106', '1162', '1114', '1110', '1178', '1190', '2000', '1063', '1258', '1253')
    GROUP BY fdc_id
  ),
  bf AS (
    SELECT * FROM read_csv('{{cache}}/usda_branded/branded_food.csv', header = true,
                           all_varchar = true, ignore_errors = true)
    WHERE market_country = 'United States'
  ),
  fd AS (
    SELECT fdc_id, description
    FROM read_csv('{{cache}}/usda_branded/food.csv', header = true,
                  all_varchar = true, ignore_errors = true)
  )
  SELECT 'usda_branded' AS source, bf.fdc_id AS source_id, 'barcode' AS kind,
    fd.description AS name,
    coalesce(nullif(bf.brand_name, ''), nullif(bf.brand_owner, '')) AS brand,
    bf.gtin_upc AS gtin,
    nut.kcal, nut.protein, nut.carbs, nut.fat, nut.fiber, nut.sodium_mg, nut.alcohol,
    nut.potassium_mg, nut.calcium_mg, nut.iron_mg, nut.magnesium_mg, nut.zinc_mg, nut.vitamin_a_ug, nut.vitamin_c_mg, coalesce(nut.vitamin_d_ug, nut.vitamin_d_iu / 40) AS vitamin_d_ug, nut.vitamin_b12_ug, nut.folate_ug, coalesce(nut.sugars_g, nut.sugars_nlea_g) AS sugars_g, nut.saturated_fat_g, nut.cholesterol_mg,
    CASE WHEN try_cast(bf.serving_size AS DOUBLE) > 0
              AND lower(bf.serving_size_unit) IN ('g', 'grm', 'gm')
         THEN to_json([{'d': coalesce(nullif(bf.household_serving_fulltext, ''),
                                      regexp_replace(bf.serving_size, '[.]0+$', '') || ' g'),
                        'g': try_cast(bf.serving_size AS DOUBLE)}])
         -- A serving in millilitres (MM-650): a drink, whose figures are then per 100 mL.
         WHEN try_cast(bf.serving_size AS DOUBLE) > 0
              AND lower(bf.serving_size_unit) IN ('ml', 'mlt')
         THEN to_json([{'d': coalesce(nullif(bf.household_serving_fulltext, ''),
                                      regexp_replace(bf.serving_size, '[.]0+$', '') || ' mL'),
                        'ml': try_cast(bf.serving_size AS DOUBLE)}])
    END AS servings,
    try_cast(bf.fdc_id AS BIGINT) AS version_key,
    CAST(epoch(try_cast(bf.modified_date AS DATE)) AS BIGINT) AS updated_at,
    nut.sugar_alcohols,
    'us' AS carbs_label,
    nullif(trim(bf.branded_food_category), '') AS category,
    CASE WHEN try_cast(bf.serving_size AS DOUBLE) > 0 AND lower(bf.serving_size_unit) IN ('ml', 'mlt') THEN 'ml' ELSE 'g' END AS basis
  FROM bf
  JOIN fd USING (fdc_id)
  LEFT JOIN nut USING (fdc_id)

  UNION ALL

  -- Open Food Facts: products sold in the United States.
  SELECT 'off', code, 'barcode', product_name, nullif(brands_en, ''), code,
    try_cast("energy-kcal_100g" AS DOUBLE),
    try_cast(proteins_100g AS DOUBLE),
    try_cast(carbohydrates_100g AS DOUBLE),
    try_cast(fat_100g AS DOUBLE),
    try_cast(fiber_100g AS DOUBLE),
    try_cast(sodium_100g AS DOUBLE) * 1000,
    try_cast(alcohol_100g AS DOUBLE),
    try_cast(potassium_100g AS DOUBLE) * 1000,
    try_cast(calcium_100g AS DOUBLE) * 1000,
    try_cast(iron_100g AS DOUBLE) * 1000,
    try_cast(magnesium_100g AS DOUBLE) * 1000,
    try_cast(zinc_100g AS DOUBLE) * 1000,
    -- Vitamin A and folate are not taken from Open Food Facts: its values are
    -- not reliably RAE or DFE (MM-307, the panel's MN-2), so they stay unknown.
    NULL,
    try_cast("vitamin-c_100g" AS DOUBLE) * 1000,
    try_cast("vitamin-d_100g" AS DOUBLE) * 1000000,
    try_cast("vitamin-b12_100g" AS DOUBLE) * 1000000,
    NULL,
    try_cast(sugars_100g AS DOUBLE),
    try_cast("saturated-fat_100g" AS DOUBLE),
    try_cast(cholesterol_100g AS DOUBLE) * 1000,
    -- A serving in millilitres (serving_ml below) makes the product per 100 mL (MM-650); any other is grams.
    CASE WHEN serving_ml IS NOT NULL THEN to_json([{'d': serving_size, 'ml': serving_ml}])
         WHEN try_cast(serving_quantity AS DOUBLE) > 0 AND serving_size <> ''
         THEN to_json([{'d': serving_size, 'g': try_cast(serving_quantity AS DOUBLE)}])
    END,
    coalesce(try_cast(last_modified_t AS BIGINT), 0),
    coalesce(try_cast(last_modified_t AS BIGINT), 0),
    try_cast(polyols_100g AS DOUBLE),
    CASE WHEN regexp_full_match(countries_tags, 'en:(united-states|canada)(,en:(united-states|canada))*') THEN 'us' ELSE 'unknown' END,
    NULL,
    CASE WHEN serving_ml IS NOT NULL THEN 'ml' ELSE 'g' END
  -- The export's brand column is `brands_en` since 2026 (MM-409); `strict_mode`
  -- off, because DuckDB 1.5 otherwise stops at the first row that is not
  -- standard CSV, where 1.1 skipped about 250,000 rows under `ignore_errors`.
  FROM (
    SELECT *,
      -- The serving's millilitres (MM-650): the millilitres its text states, when they are serving_quantity
      -- (the export takes the last unit in the text, so "240 ml (245 g)" is grams), or its fluid ounces, which
      -- the export converts to millilitres itself (the panel's IN-2 and IN-3). NULL for a weight.
      CASE WHEN try_cast(serving_quantity AS DOUBLE) > 0
                AND abs(coalesce(try_cast(replace(regexp_extract(serving_size, '(?i)([0-9]+(?:[.,][0-9]+)?)\s*ml\b', 1), ',', '.') AS DOUBLE), -1)
                        - try_cast(serving_quantity AS DOUBLE)) < 0.5
           THEN try_cast(serving_quantity AS DOUBLE)
           WHEN try_cast(serving_quantity AS DOUBLE) > 0
                AND abs(coalesce(try_cast(replace(regexp_extract(serving_size, '(?i)([0-9]+(?:[.,][0-9]+)?)\s*fl\.?\s*oz', 1), ',', '.') AS DOUBLE), -1) * 29.5735295625
                        - try_cast(serving_quantity AS DOUBLE)) < 0.6
           THEN try_cast(serving_quantity AS DOUBLE)
      END AS serving_ml
    FROM read_csv('{{cache}}/off.csv.gz', delim = chr(9), header = true, quote = '',
                  all_varchar = true, ignore_errors = true, sample_size = -1, strict_mode = false)
  )
  WHERE countries_tags LIKE '%en:united-states%'

  ORDER BY source, source_id
) TO '{{out}}/candidates_barcode.csv' (FORMAT csv, HEADER);

-- USDA Foundation and SR Legacy: generic foods, with their household measures.
COPY (
  WITH fd AS (
    SELECT 'usda_foundation' AS source, fdc_id, description, food_category_id
    FROM read_csv('{{cache}}/usda_foundation/food.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE data_type = 'foundation_food'
    UNION ALL
    SELECT 'usda_sr_legacy', fdc_id, description, food_category_id
    FROM read_csv('{{cache}}/usda_sr_legacy/food.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE data_type = 'sr_legacy_food'
    UNION ALL
    -- FNDDS 2021-2023 (MM-383): foods as eaten, compiled by USDA for the
    -- national dietary survey; the same CSV layout and nutrient ids.
    SELECT 'usda_fndds', fdc_id, description, food_category_id
    FROM read_csv('{{cache}}/usda_fndds/food.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE data_type = 'survey_fndds_food'
  ),
  -- Each food's category (MM-616): food_category_id is an id into food_category.csv
  -- for Foundation and SR Legacy, and a WWEIA category code for FNDDS.
  categories AS (
    SELECT 'usda_foundation' AS source, id, description FROM read_csv(
      '{{cache}}/usda_foundation/food_category.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    SELECT 'usda_sr_legacy', id, description FROM read_csv(
      '{{cache}}/usda_sr_legacy/food_category.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    SELECT 'usda_fndds', wweia_food_category, wweia_food_category_description FROM read_csv(
      '{{cache}}/usda_fndds/wweia_food_category.csv', header = true,
      all_varchar = true, ignore_errors = true)
  ),
  nut_all AS (
    SELECT 'usda_foundation' AS source, * FROM read_csv(
      '{{cache}}/usda_foundation/food_nutrient.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    SELECT 'usda_sr_legacy', * FROM read_csv(
      '{{cache}}/usda_sr_legacy/food_nutrient.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    -- The survey download may carry rows of other data types too (the panel's IN-14): only FNDDS foods' rows are read.
    -- Its nutrient_id column holds the legacy nutrient number (208 for energy, 203 for protein), not the FoodData
    -- Central id the other files use (MM-409); the survey's own nutrient.csv maps one to the other.
    SELECT 'usda_fndds', n.* REPLACE (coalesce(fn.id, n.nutrient_id) AS nutrient_id) FROM read_csv(
      '{{cache}}/usda_fndds/food_nutrient.csv', header = true,
      all_varchar = true, ignore_errors = true) n
    LEFT JOIN read_csv('{{cache}}/usda_fndds/nutrient.csv', header = true,
      all_varchar = true, ignore_errors = true) fn
      ON regexp_replace(fn.nutrient_nbr, '[.]0+$', '') = n.nutrient_id
    WHERE n.fdc_id IN (SELECT fdc_id FROM fd WHERE source = 'usda_fndds')
  ),
  nut AS (
    SELECT source, fdc_id,
      max(CASE WHEN nutrient_id = '1008' THEN try_cast(amount AS DOUBLE) END) AS kcal,
      max(CASE WHEN nutrient_id IN ('2047', '2048') THEN try_cast(amount AS DOUBLE) END) AS kcal_atwater,
      max(CASE WHEN nutrient_id = '1003' THEN try_cast(amount AS DOUBLE) END) AS protein,
      max(CASE WHEN nutrient_id = '1005' THEN try_cast(amount AS DOUBLE) END) AS carbs,
      max(CASE WHEN nutrient_id = '1004' THEN try_cast(amount AS DOUBLE) END) AS fat,
      max(CASE WHEN nutrient_id = '1079' THEN try_cast(amount AS DOUBLE) END) AS fiber,
      max(CASE WHEN nutrient_id = '1093' THEN try_cast(amount AS DOUBLE) END) AS sodium_mg,
      max(CASE WHEN nutrient_id = '1018' THEN try_cast(amount AS DOUBLE) END) AS alcohol,
      max(CASE WHEN nutrient_id = '1092' THEN try_cast(amount AS DOUBLE) END) AS potassium_mg,
      max(CASE WHEN nutrient_id = '1087' THEN try_cast(amount AS DOUBLE) END) AS calcium_mg,
      max(CASE WHEN nutrient_id = '1089' THEN try_cast(amount AS DOUBLE) END) AS iron_mg,
      max(CASE WHEN nutrient_id = '1090' THEN try_cast(amount AS DOUBLE) END) AS magnesium_mg,
      max(CASE WHEN nutrient_id = '1095' THEN try_cast(amount AS DOUBLE) END) AS zinc_mg,
      max(CASE WHEN nutrient_id = '1106' THEN try_cast(amount AS DOUBLE) END) AS vitamin_a_ug,
      max(CASE WHEN nutrient_id = '1162' THEN try_cast(amount AS DOUBLE) END) AS vitamin_c_mg,
      max(CASE WHEN nutrient_id = '1114' THEN try_cast(amount AS DOUBLE) END) AS vitamin_d_ug,
      max(CASE WHEN nutrient_id = '1110' THEN try_cast(amount AS DOUBLE) END) AS vitamin_d_iu,
      max(CASE WHEN nutrient_id = '1178' THEN try_cast(amount AS DOUBLE) END) AS vitamin_b12_ug,
      max(CASE WHEN nutrient_id = '1190' THEN try_cast(amount AS DOUBLE) END) AS folate_ug,
      max(CASE WHEN nutrient_id = '2000' THEN try_cast(amount AS DOUBLE) END) AS sugars_g,
      max(CASE WHEN nutrient_id = '1063' THEN try_cast(amount AS DOUBLE) END) AS sugars_nlea_g,
      max(CASE WHEN nutrient_id = '1258' THEN try_cast(amount AS DOUBLE) END) AS saturated_fat_g,
      max(CASE WHEN nutrient_id = '1253' THEN try_cast(amount AS DOUBLE) END) AS cholesterol_mg
    FROM nut_all
    WHERE nutrient_id IN ('1008', '2047', '2048', '1003', '1005', '1004', '1079', '1093', '1018',
                          '1092', '1087', '1089', '1090', '1095', '1106', '1162', '1114', '1110', '1178', '1190', '2000', '1063', '1258', '1253')
    GROUP BY source, fdc_id
  ),
  units AS (
    SELECT id, name FROM read_csv('{{cache}}/usda_foundation/measure_unit.csv',
      header = true, all_varchar = true, ignore_errors = true)
  ),
  portion_all AS (
    SELECT 'usda_foundation' AS source, * FROM read_csv(
      '{{cache}}/usda_foundation/food_portion.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    SELECT 'usda_sr_legacy', * FROM read_csv(
      '{{cache}}/usda_sr_legacy/food_portion.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    -- FNDDS portions (the panel's IN-13): the amount sits in the description, a
    -- numeric portion code may sit in the modifier (dropped), and a "Quantity
    -- not specified" portion carries no measure (dropped).
    SELECT 'usda_fndds', p.* REPLACE (CASE WHEN regexp_matches(p.modifier, '^\d+$') THEN NULL ELSE p.modifier END AS modifier)
    FROM read_csv(
      '{{cache}}/usda_fndds/food_portion.csv', header = true,
      all_varchar = true, ignore_errors = true) p
    WHERE p.fdc_id IN (SELECT fdc_id FROM fd WHERE source = 'usda_fndds')
      AND NOT starts_with(lower(coalesce(p.portion_description, '')), 'quantity not specified')
  ),
  portions AS (
    SELECT p.source, p.fdc_id,
      to_json(list({
        'd': trim(regexp_replace(concat_ws(' ',
               regexp_replace(p.amount, '[.]0+$', ''),
               CASE WHEN u.name = 'undetermined' THEN NULL ELSE u.name END,
               nullif(p.portion_description, ''),
               nullif(p.modifier, '')), '\s+', ' ', 'g')),
        'g': try_cast(p.gram_weight AS DOUBLE)}
        ORDER BY try_cast(p.seq_num AS INTEGER) NULLS LAST, try_cast(p.id AS BIGINT))) AS servings
    FROM portion_all p LEFT JOIN units u ON u.id = p.measure_unit_id
    WHERE try_cast(p.gram_weight AS DOUBLE) > 0
    GROUP BY p.source, p.fdc_id
  )
  SELECT fd.source, fd.fdc_id AS source_id, 'generic' AS kind, fd.description AS name,
    NULL AS brand, NULL AS gtin,
    coalesce(nut.kcal, nut.kcal_atwater) AS kcal,
    nut.protein, nut.carbs, nut.fat, nut.fiber, nut.sodium_mg, nut.alcohol,
    nut.potassium_mg, nut.calcium_mg, nut.iron_mg, nut.magnesium_mg, nut.zinc_mg, nut.vitamin_a_ug, nut.vitamin_c_mg, coalesce(nut.vitamin_d_ug, nut.vitamin_d_iu / 40) AS vitamin_d_ug, nut.vitamin_b12_ug, nut.folate_ug, coalesce(nut.sugars_g, nut.sugars_nlea_g) AS sugars_g, nut.saturated_fat_g, nut.cholesterol_mg,
    portions.servings, 0 AS version_key, 0 AS updated_at,
    nullif(trim(cat.description), '') AS category,
    'g' AS basis
  FROM fd
  LEFT JOIN nut ON nut.source = fd.source AND nut.fdc_id = fd.fdc_id
  LEFT JOIN portions ON portions.source = fd.source AND portions.fdc_id = fd.fdc_id
  LEFT JOIN categories cat ON cat.source = fd.source AND cat.id = fd.food_category_id
  ORDER BY fd.source, fd.fdc_id
) TO '{{out}}/candidates_generic.csv' (FORMAT csv, HEADER);
