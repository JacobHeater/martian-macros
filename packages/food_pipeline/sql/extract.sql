-- MM-52: maps each source onto one schema and writes {{out}}/candidates.csv.
-- Run by `mm food build` with the DuckDB command-line tool; {{cache}} and
-- {{out}} are replaced with folder paths. No checks happen here beyond reading:
-- the nutrition rules, barcode normalization and conflict handling are Dart
-- (packages/domain and packages/food_pipeline), so there is one implementation.
--
-- Columns: source, source_id, kind, name, brand, gtin, kcal, protein, carbs,
-- fat, fiber, sodium_mg, alcohol, servings (JSON [{"d": text, "g": grams}]),
-- version_key (orders versions of one product within a source; highest wins),
-- updated_at (when the source last changed the record, seconds since 1970).
-- All nutrients are per 100 g.

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
      max(CASE WHEN nutrient_id = '1018' THEN try_cast(amount AS DOUBLE) END) AS alcohol
    FROM read_csv('{{cache}}/usda_branded/food_nutrient.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE nutrient_id IN ('1008', '1003', '1005', '1004', '1079', '1093', '1018')
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
    CASE WHEN try_cast(bf.serving_size AS DOUBLE) > 0
              AND lower(bf.serving_size_unit) IN ('g', 'grm')
         THEN to_json([{'d': coalesce(nullif(bf.household_serving_fulltext, ''),
                                      bf.serving_size || ' g'),
                        'g': try_cast(bf.serving_size AS DOUBLE)}])
    END AS servings,
    try_cast(bf.fdc_id AS BIGINT) AS version_key,
    CAST(epoch(try_cast(bf.modified_date AS DATE)) AS BIGINT) AS updated_at
  FROM bf
  JOIN fd USING (fdc_id)
  LEFT JOIN nut USING (fdc_id)

  UNION ALL

  -- Open Food Facts: products sold in the United States.
  SELECT 'off', code, 'barcode', product_name, nullif(brands, ''), code,
    try_cast("energy-kcal_100g" AS DOUBLE),
    try_cast(proteins_100g AS DOUBLE),
    try_cast(carbohydrates_100g AS DOUBLE),
    try_cast(fat_100g AS DOUBLE),
    try_cast(fiber_100g AS DOUBLE),
    try_cast(sodium_100g AS DOUBLE) * 1000,
    try_cast(alcohol_100g AS DOUBLE),
    CASE WHEN try_cast(serving_quantity AS DOUBLE) > 0 AND serving_size <> ''
         THEN to_json([{'d': serving_size, 'g': try_cast(serving_quantity AS DOUBLE)}])
    END,
    coalesce(try_cast(last_modified_t AS BIGINT), 0),
    coalesce(try_cast(last_modified_t AS BIGINT), 0)
  FROM read_csv('{{cache}}/off.csv.gz', delim = chr(9), header = true, quote = '',
                all_varchar = true, ignore_errors = true, sample_size = -1)
  WHERE countries_tags LIKE '%en:united-states%'

  ORDER BY source, source_id
) TO '{{out}}/candidates_barcode.csv' (FORMAT csv, HEADER);

-- USDA Foundation and SR Legacy: generic foods, with their household measures.
COPY (
  WITH fd AS (
    SELECT 'usda_foundation' AS source, fdc_id, description
    FROM read_csv('{{cache}}/usda_foundation/food.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE data_type = 'foundation_food'
    UNION ALL
    SELECT 'usda_sr_legacy', fdc_id, description
    FROM read_csv('{{cache}}/usda_sr_legacy/food.csv', header = true,
                  all_varchar = true, ignore_errors = true)
    WHERE data_type = 'sr_legacy_food'
  ),
  nut_all AS (
    SELECT 'usda_foundation' AS source, * FROM read_csv(
      '{{cache}}/usda_foundation/food_nutrient.csv', header = true,
      all_varchar = true, ignore_errors = true)
    UNION ALL
    SELECT 'usda_sr_legacy', * FROM read_csv(
      '{{cache}}/usda_sr_legacy/food_nutrient.csv', header = true,
      all_varchar = true, ignore_errors = true)
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
      max(CASE WHEN nutrient_id = '1018' THEN try_cast(amount AS DOUBLE) END) AS alcohol
    FROM nut_all
    WHERE nutrient_id IN ('1008', '2047', '2048', '1003', '1005', '1004', '1079', '1093', '1018')
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
    portions.servings, 0 AS version_key, 0 AS updated_at
  FROM fd
  LEFT JOIN nut ON nut.source = fd.source AND nut.fdc_id = fd.fdc_id
  LEFT JOIN portions ON portions.source = fd.source AND portions.fdc_id = fd.fdc_id
  ORDER BY fd.source, fd.fdc_id
) TO '{{out}}/candidates_generic.csv' (FORMAT csv, HEADER);
