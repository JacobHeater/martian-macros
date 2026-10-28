/**
 * The shape a new installation is created from, at `currentSchemaVersion`.
 * An existing database is taken here by the steps in `migrationSteps`.
 */
export const currentSchema = `
CREATE TABLE "setups" (
  "id" INTEGER NOT NULL CHECK("id" = 1),
  "sex" TEXT NOT NULL CHECK("sex" IN ('male', 'female')),
  "birth_epoch_day" INTEGER NOT NULL,
  "height_cm" REAL NOT NULL,
  "training_status" TEXT NOT NULL,
  "training_days_per_week" INTEGER NOT NULL,
  "profile_revision" INTEGER NOT NULL DEFAULT 0,
  "daily_activity" TEXT NOT NULL DEFAULT 'light',
  "goal_mode" TEXT NOT NULL,
  "unit_system" TEXT NOT NULL,
  "onboarded_epoch_day" INTEGER NOT NULL,
  "body_fat_percent" REAL NULL,
  "requested_loss_fraction" REAL NULL,
  "pregnant" INTEGER NOT NULL DEFAULT 0 CHECK ("pregnant" IN (0, 1)),
  "breastfeeding" INTEGER NOT NULL DEFAULT 0 CHECK ("breastfeeding" IN (0, 1)),
  "eating_disorder_history" INTEGER NOT NULL DEFAULT 0 CHECK ("eating_disorder_history" IN (0, 1)),
  "chronic_kidney_disease" INTEGER NOT NULL DEFAULT 0 CHECK ("chronic_kidney_disease" IN (0, 1)),
  "androgen_use" INTEGER NOT NULL DEFAULT 0 CHECK ("androgen_use" IN (0, 1)),
  "pcos" INTEGER NOT NULL DEFAULT 0 CHECK ("pcos" IN (0, 1)),
  "menopause" INTEGER NOT NULL DEFAULT 0 CHECK ("menopause" IN (0, 1)),
  "thyroid_condition" INTEGER NOT NULL DEFAULT 0 CHECK ("thyroid_condition" IN (0, 1)),
  "insulin_or_sulfonylurea" INTEGER NOT NULL DEFAULT 0 CHECK ("insulin_or_sulfonylurea" IN (0, 1)),
  "insulin_care_team_confirmed" INTEGER NOT NULL DEFAULT 0 CHECK ("insulin_care_team_confirmed" IN (0, 1)),
  "bariatric_surgery" INTEGER NOT NULL DEFAULT 0 CHECK ("bariatric_surgery" IN (0, 1)),
  "weight_affecting_medication" INTEGER NOT NULL DEFAULT 0 CHECK ("weight_affecting_medication" IN (0, 1)),
  "health_check_confirmed_epoch_day" INTEGER NULL,
  "maintenance_week_from_epoch_day" INTEGER NULL,
  "relief_answered_epoch_day" INTEGER NULL,
  "health_check_skip_count" INTEGER NOT NULL DEFAULT 0,
  "creatine_started_epoch_day" INTEGER NULL,
  "fluid_limited_by_clinician" INTEGER NOT NULL DEFAULT 0 CHECK ("fluid_limited_by_clinician" IN (0, 1)),
  "pace_changed_epoch_day" INTEGER NULL,
  "maintenance_anchor_epoch_day" INTEGER NULL,
  "maintenance_correction_from_epoch_day" INTEGER NULL,
  "sleep_disorder" INTEGER NOT NULL DEFAULT 0 CHECK ("sleep_disorder" IN (0, 1)),
  "lean_gain_pace" TEXT NOT NULL DEFAULT 'standard' CHECK ("lean_gain_pace" IN ('standard', 'slower')),
  "weight_loss_medication" INTEGER NOT NULL DEFAULT 0 CHECK ("weight_loss_medication" IN (0, 1)),
  PRIMARY KEY ("id")
);
CREATE TABLE "weight_entries" (
  "epoch_day" INTEGER NOT NULL,
  "weight_kg" REAL NOT NULL CHECK("weight_kg" BETWEEN 20.0 AND 500.0),
  "device_id" TEXT NULL,
  PRIMARY KEY ("epoch_day")
);
CREATE TABLE "food_entries" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "epoch_day" INTEGER NOT NULL,
  "meal" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kcal" REAL NOT NULL CHECK("kcal" >= 0.0),
  "protein_g" REAL NOT NULL CHECK("protein_g" >= 0.0),
  "carbs_g" REAL NOT NULL CHECK("carbs_g" >= 0.0),
  "fat_g" REAL NOT NULL CHECK("fat_g" >= 0.0),
  "quantity_source" TEXT NOT NULL,
  "portion_quantity" REAL NULL CHECK("portion_quantity" > 0.0),
  "portion_unit" TEXT NULL,
  "nutrition_basis" TEXT NULL,
  "reference_basis" TEXT NULL,
  "reference_kcal" REAL NULL,
  "reference_protein_g" REAL NULL,
  "reference_carbs_g" REAL NULL,
  "reference_fat_g" REAL NULL,
  "serving_description" TEXT NULL,
  "serving_grams" REAL NULL,
  "serving_milliliters" REAL NULL,
  "serving_unit" TEXT NULL,
  "density_g_per_ml" REAL NULL,
  "implied_grams" REAL NULL,
  "hand_model_version" INTEGER NULL,
  "origin_pack_id" TEXT NULL,
  "origin_food_id" INTEGER NULL,
  "origin_source" TEXT NULL,
  "origin_source_id" TEXT NULL,
  "fiber_g" REAL NULL,
  "sodium_mg" REAL NULL,
  "alcohol_g" REAL NULL,
  "created_at" INTEGER NOT NULL DEFAULT (CAST(strftime('%s', CURRENT_TIMESTAMP) AS INTEGER)),
  "potassium_mg" REAL NULL,
  "calcium_mg" REAL NULL,
  "iron_mg" REAL NULL,
  "magnesium_mg" REAL NULL,
  "zinc_mg" REAL NULL,
  "vitamin_a_ug" REAL NULL,
  "vitamin_c_mg" REAL NULL,
  "vitamin_d_ug" REAL NULL,
  "vitamin_b12_ug" REAL NULL,
  "folate_ug" REAL NULL,
  "sugars_g" REAL NULL,
  "saturated_fat_g" REAL NULL,
  "cholesterol_mg" REAL NULL,
  "sugar_alcohols_g" REAL NULL,
  "preparation" TEXT NULL,
  "conversion_kind" TEXT NULL,
  "conversion_factor" REAL NULL CHECK("conversion_factor" IS NULL OR "conversion_factor" > 0.0),
  "eaten_at_minute" INTEGER NULL CHECK ("eaten_at_minute" IS NULL OR "eaten_at_minute" BETWEEN 0 AND 1439),
  "logged_meal_key" TEXT NULL,
  "logged_meal_name" TEXT NULL CHECK (("logged_meal_key" IS NULL) = ("logged_meal_name" IS NULL)),
  "evidence_kind" TEXT NULL CHECK ("evidence_kind" IS NULL OR "evidence_kind" IN ('cited', 'matched', 'estimated', 'yours')),
  "evidence_citation" TEXT NULL
);
CREATE INDEX "food_entries_epoch_day" ON "food_entries" ("epoch_day");
CREATE TABLE "day_marks" (
  "epoch_day" INTEGER NOT NULL,
  "completeness" TEXT NOT NULL,
  PRIMARY KEY ("epoch_day")
);
CREATE TABLE "targets_history" (
  "effective_epoch_day" INTEGER NOT NULL,
  "mode" TEXT NOT NULL,
  "kcal" REAL NOT NULL,
  "protein_g" REAL NOT NULL,
  "protein_minimum_g" REAL NULL,
  "fat_g" REAL NOT NULL,
  "carbs_g" REAL NOT NULL,
  "weekly_rate_fraction" REAL NOT NULL,
  "flags" TEXT NOT NULL DEFAULT '',
  "tdee_kcal" REAL NOT NULL,
  "tdee_sigma_kcal" REAL NOT NULL,
  "explanation" TEXT NULL,
  "summary_seen" INTEGER NOT NULL DEFAULT 1 CHECK ("summary_seen" IN (0, 1)),
  "target_rules_version" INTEGER NOT NULL DEFAULT 1,
  "profile_revision" INTEGER NOT NULL DEFAULT 0,
  "safety_body_fat_percent" REAL NULL,
  "tdee_status" TEXT NOT NULL,
  "requested_loss_fraction" REAL NULL,
  "lean_gain_pace" TEXT NULL CHECK ("lean_gain_pace" IS NULL OR "lean_gain_pace" IN ('standard', 'slower')),
  PRIMARY KEY ("effective_epoch_day")
);
CREATE TABLE "user_preferences" (
  "id" INTEGER NOT NULL CHECK("id" = 1),
  "theme_preference" TEXT NOT NULL DEFAULT 'unselected',
  "easy_to_miss_enabled" INTEGER NOT NULL DEFAULT 1 CHECK ("easy_to_miss_enabled" IN (0, 1)),
  "easy_to_miss_last_shown_epoch_day" INTEGER NULL,
  "detail_level" TEXT NOT NULL DEFAULT 'standard',
  "under_eating_dismissed_epoch_day" INTEGER NULL,
  "return_screen_dismissed_epoch_day" INTEGER NULL,
  "recovery_check_in_skipped_epoch_day" INTEGER NULL,
  "terms_accepted_version" INTEGER NULL,
  "terms_accepted_epoch_day" INTEGER NULL,
  "macro_picture" TEXT NOT NULL DEFAULT 'bars',
  "sodium_limit_mg" INTEGER NULL,
  "sodium_limit_since_epoch_day" INTEGER NULL,
  "water_goal_ml" REAL NULL,
  "water_goal_off" INTEGER NOT NULL DEFAULT 0 CHECK ("water_goal_off" IN (0, 1)),
  "inline_insights_off" INTEGER NOT NULL DEFAULT 0 CHECK ("inline_insights_off" IN (0, 1)),
  "inline_insight_areas_off" TEXT NOT NULL DEFAULT '',
  "inline_insight_kinds_off" TEXT NOT NULL DEFAULT '',
  "net_carbs" INTEGER NOT NULL DEFAULT 1 CHECK ("net_carbs" IN (0, 1)),
  "last_backup_epoch_day" INTEGER NULL,
  "exact_targets" INTEGER NOT NULL DEFAULT 0 CHECK ("exact_targets" IN (0, 1)),
  "label_note_dismissed_epoch_day" INTEGER NULL,
  "ease_into_maintenance" INTEGER NOT NULL DEFAULT 0 CHECK ("ease_into_maintenance" IN (0, 1)),
  "online_lookup" TEXT NOT NULL DEFAULT 'ask' CHECK ("online_lookup" IN ('ask', 'always', 'never')),
  "usual_cooking_fat" TEXT NOT NULL DEFAULT 'oil',
  "primary_scale_source_id" TEXT NULL,
  "weigh_in_window_start_minute" INTEGER NULL CHECK ("weigh_in_window_start_minute" IS NULL OR "weigh_in_window_start_minute" BETWEEN 0 AND 1439),
  "weigh_in_window_end_minute" INTEGER NULL CHECK ("weigh_in_window_end_minute" IS NULL OR "weigh_in_window_end_minute" BETWEEN 1 AND 1440),
  "weight_display" TEXT NULL CHECK ("weight_display" IS NULL OR "weight_display" IN ('everything', 'trendOnly', 'hidden')),
  "weight_display_offered" INTEGER NOT NULL DEFAULT 0 CHECK ("weight_display_offered" IN (0, 1)),
  "cardio_steps_floor" INTEGER NULL CHECK ("cardio_steps_floor" IS NULL OR "cardio_steps_floor" BETWEEN 1000 AND 30000),
  "cardio_minutes_floor" INTEGER NULL CHECK ("cardio_minutes_floor" IS NULL OR "cardio_minutes_floor" BETWEEN 0 AND 1000),
  PRIMARY KEY ("id")
);
CREATE TABLE "weight_events" (
  "date_epoch_day" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  PRIMARY KEY ("date_epoch_day", "type")
);
CREATE TABLE "custom_foods" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "serving_description" TEXT NOT NULL,
  "serving_grams" REAL NULL CHECK("serving_grams" > 0.0),
  "kcal" REAL NOT NULL CHECK("kcal" >= 0.0),
  "protein_g" REAL NOT NULL CHECK("protein_g" >= 0.0),
  "carbs_g" REAL NOT NULL CHECK("carbs_g" >= 0.0),
  "fat_g" REAL NOT NULL CHECK("fat_g" >= 0.0),
  "barcode" TEXT NULL,
  "servings" REAL NULL,
  "cooked_weight_grams" REAL NULL,
  "fiber_g" REAL NULL,
  "sodium_mg" REAL NULL,
  "potassium_mg" REAL NULL,
  "calcium_mg" REAL NULL,
  "iron_mg" REAL NULL,
  "magnesium_mg" REAL NULL,
  "zinc_mg" REAL NULL,
  "vitamin_a_ug" REAL NULL,
  "vitamin_c_mg" REAL NULL,
  "vitamin_d_ug" REAL NULL,
  "vitamin_b12_ug" REAL NULL,
  "folate_ug" REAL NULL,
  "sugars_g" REAL NULL,
  "saturated_fat_g" REAL NULL,
  "cholesterol_mg" REAL NULL,
  "sugar_alcohols_g" REAL NULL
);
CREATE TABLE "recipe_ingredients" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "recipe_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "grams" REAL NULL,
  "kcal" REAL NOT NULL,
  "protein_g" REAL NOT NULL,
  "carbs_g" REAL NOT NULL,
  "fat_g" REAL NOT NULL,
  "source_pack_id" TEXT NULL,
  "source_food_id" INTEGER NULL
);
CREATE TABLE "insight_log" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "rule" TEXT NOT NULL,
  "shown_epoch_day" INTEGER NOT NULL,
  "dismissed_epoch_day" INTEGER NULL
);
CREATE TABLE "pauses" (
  "from_epoch_day" INTEGER NOT NULL,
  "to_epoch_day" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "extended" INTEGER NOT NULL DEFAULT 0 CHECK ("extended" IN (0, 1)),
  PRIMARY KEY ("from_epoch_day")
);
CREATE TABLE "reminders" (
  "kind" TEXT NOT NULL,
  "enabled" INTEGER NOT NULL CHECK ("enabled" IN (0, 1)),
  "minute_of_day" INTEGER NOT NULL,
  "count_from_epoch_day" INTEGER NULL,
  PRIMARY KEY ("kind")
);
CREATE TABLE "recovery_check_ins" (
  "date_epoch_day" INTEGER NOT NULL,
  "hunger" INTEGER NOT NULL,
  "energy" INTEGER NOT NULL,
  "sleep" INTEGER NOT NULL,
  "training" INTEGER NOT NULL,
  "mood" INTEGER NOT NULL,
  "sleep_hours" REAL NULL,
  PRIMARY KEY ("date_epoch_day")
);
CREATE TABLE "workouts" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "date_epoch_day" INTEGER NOT NULL,
  "started_at_ms" INTEGER NOT NULL,
  "ended_at_ms" INTEGER NULL,
  "paused_at_ms" INTEGER NULL,
  "paused_for_ms" INTEGER NOT NULL DEFAULT 0,
  "set_started_at_ms" INTEGER NULL,
  "platform_id" TEXT NULL,
  "platform_source_name" TEXT NULL
);
CREATE TABLE "workout_exercises" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "workout_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "exercise_id" TEXT NOT NULL,
  "rest_target_seconds" INTEGER NULL
);
CREATE TABLE "workout_sets" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "workout_id" INTEGER NOT NULL,
  "exercise_position" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "reps" INTEGER NOT NULL CHECK("reps" >= 0),
  "load_kg" REAL NOT NULL,
  "rir" INTEGER NULL CHECK("rir" BETWEEN 0 AND 5),
  "started_at_ms" INTEGER NULL,
  "ended_at_ms" INTEGER NULL
);
CREATE TABLE "custom_exercises" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "equipment" TEXT NOT NULL,
  "primary_muscle" TEXT NOT NULL,
  "secondary_muscles" TEXT NOT NULL,
  "load_kind" TEXT NOT NULL
);
CREATE TABLE "imported_samples" (
  "type" TEXT NOT NULL,
  "platform_id" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "start_ms" INTEGER NOT NULL,
  "end_ms" INTEGER NULL,
  "source_id" TEXT NOT NULL,
  "source_name" TEXT NOT NULL,
  PRIMARY KEY ("type", "platform_id")
);
CREATE TABLE "health_import_tokens" (
  "type" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  PRIMARY KEY ("type")
);
CREATE TABLE "water_entries" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "epoch_day" INTEGER NOT NULL,
  "ml" REAL NOT NULL CHECK("ml" > 0.0 AND "ml" <= 3000.0),
  "at_ms" INTEGER NOT NULL
);
CREATE TABLE "inline_insight_log" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "kind" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "anchor_kind" TEXT NOT NULL,
  "anchor_id" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "line" TEXT NOT NULL,
  "first_epoch_day" INTEGER NOT NULL,
  UNIQUE ("kind", "anchor_kind", "anchor_id")
);
CREATE TABLE "menstruation_days" (
  "epoch_day" INTEGER NOT NULL,
  PRIMARY KEY ("epoch_day")
);
CREATE TABLE "online_foods" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "gtin" TEXT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NULL,
  "kcal" REAL NOT NULL CHECK("kcal" >= 0.0),
  "protein_g" REAL NOT NULL CHECK("protein_g" >= 0.0),
  "carbs_g" REAL NOT NULL CHECK("carbs_g" >= 0.0),
  "fat_g" REAL NOT NULL CHECK("fat_g" >= 0.0),
  "fiber_g" REAL NULL,
  "sugar_alcohols_g" REAL NULL,
  "sodium_mg" REAL NULL,
  "alcohol_g" REAL NULL,
  "micros" TEXT NOT NULL DEFAULT '{}',
  "servings" TEXT NOT NULL DEFAULT '[]',
  "source" TEXT NOT NULL,
  "source_id" TEXT NULL,
  "tier" INTEGER NOT NULL,
  "tier_reason" TEXT NOT NULL
);
CREATE UNIQUE INDEX "online_foods_gtin" ON "online_foods" ("gtin");
CREATE TABLE "inline_insight_snoozes" (
  "kind" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "resumes_epoch_day" INTEGER NULL,
  PRIMARY KEY ("kind", "subject")
);
CREATE TABLE "exercise_progressions" (
  "exercise_id" TEXT NOT NULL,
  "reps_low" INTEGER NOT NULL,
  "reps_high" INTEGER NOT NULL,
  "load_step_kg" REAL NULL,
  PRIMARY KEY ("exercise_id"),
  CHECK (reps_low >= 1 AND reps_low < reps_high),
  CHECK (load_step_kg IS NULL OR load_step_kg > 0)
);
CREATE TABLE "sleep_nights" (
  "epoch_day" INTEGER NOT NULL,
  "minutes_asleep" REAL NOT NULL CHECK("minutes_asleep" > 0.0 AND "minutes_asleep" <= 1440.0),
  "source" TEXT NOT NULL CHECK("source" IN ('typed', 'imported')),
  "source_name" TEXT NULL,
  PRIMARY KEY ("epoch_day")
);
CREATE TABLE "target_shapes" (
  "since_epoch_day" INTEGER NOT NULL,
  "fat_share" REAL NULL CHECK("fat_share" IS NULL OR "fat_share" BETWEEN 0.2 AND 0.4),
  "carb_floor_off" INTEGER NOT NULL DEFAULT 0 CHECK ("carb_floor_off" IN (0, 1)),
  "higher_days" TEXT NOT NULL DEFAULT '',
  "raise_share" REAL NOT NULL CHECK("raise_share" > 0.0 AND "raise_share" < 1.0),
  PRIMARY KEY ("since_epoch_day")
);
CREATE TABLE "goal_body_fat" (
  "id" INTEGER NOT NULL PRIMARY KEY CHECK("id" = 1),
  "percent" REAL NOT NULL CHECK("percent" > 0.0 AND "percent" < 100.0),
  "set_epoch_day" INTEGER NOT NULL
);
CREATE UNIQUE INDEX "workouts_platform_id" ON "workouts" ("platform_id");
CREATE TABLE "deleted_platform_workouts" (
  "platform_id" TEXT NOT NULL PRIMARY KEY
);
CREATE TABLE "body_measurements" (
  "site" TEXT NOT NULL CHECK ("site" IN ('waist', 'neck', 'chest', 'hips', 'upperArm', 'thigh', 'calf')),
  "epoch_day" INTEGER NOT NULL,
  "value_cm" REAL NOT NULL CHECK("value_cm" BETWEEN 10.0 AND 300.0),
  "reading1_cm" REAL NULL,
  "reading2_cm" REAL NULL,
  "reading3_cm" REAL NULL,
  PRIMARY KEY ("site", "epoch_day")
);
CREATE TABLE "measurement_settings" (
  "id" INTEGER NOT NULL PRIMARY KEY CHECK("id" = 1),
  "sites" TEXT NOT NULL DEFAULT '',
  "limb_side" TEXT NULL CHECK ("limb_side" IS NULL OR "limb_side" IN ('left', 'right')),
  "suggestion_answered" INTEGER NOT NULL DEFAULT 0 CHECK ("suggestion_answered" IN (0, 1))
);
CREATE TABLE "day_kinds" (
  "epoch_day" INTEGER NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('refeed', 'dayOff')),
  PRIMARY KEY ("epoch_day")
);
CREATE TABLE "trend_announcements" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "trend_key" TEXT NOT NULL,
  "transition" TEXT NOT NULL CHECK ("transition" IN ('new', 'continuing', 'update', 'reversed', 'held', 'resolved', 'backAgain')),
  "on_epoch_day" INTEGER NOT NULL,
  "direction" TEXT NOT NULL CHECK ("direction" IN ('down', 'up')),
  "onset_epoch_day" INTEGER NULL,
  "effect" REAL NOT NULL,
  "unit" TEXT NOT NULL,
  "n" INTEGER NOT NULL,
  "k" INTEGER NOT NULL,
  "span_days" INTEGER NOT NULL CHECK ("span_days" IN (7, 14, 30, 90)),
  "coverage" REAL NOT NULL,
  "tier" TEXT NOT NULL CHECK ("tier" IN ('silent', 'clear', 'strong')),
  "rules_version" INTEGER NOT NULL
);
CREATE TABLE "finding_dismissals" (
  "finding_id" TEXT NOT NULL,
  "dismissed_epoch_day" INTEGER NOT NULL,
  PRIMARY KEY ("finding_id", "dismissed_epoch_day")
);
CREATE TABLE "coach_advice_given" (
  "food_key" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('skip', 'halve', 'swap', 'taken')),
  "given_epoch_day" INTEGER NOT NULL,
  "food_name" TEXT NOT NULL,
  "replacement_name" TEXT NULL,
  "kcal" REAL NOT NULL,
  PRIMARY KEY ("food_key", "kind", "given_epoch_day")
);
CREATE TABLE "saved_meals" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "saved_epoch_day" INTEGER NOT NULL
);
CREATE TABLE "saved_meal_foods" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "saved_meal_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "epoch_day" INTEGER NOT NULL,
  "meal" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kcal" REAL NOT NULL CHECK("kcal" >= 0.0),
  "protein_g" REAL NOT NULL CHECK("protein_g" >= 0.0),
  "carbs_g" REAL NOT NULL CHECK("carbs_g" >= 0.0),
  "fat_g" REAL NOT NULL CHECK("fat_g" >= 0.0),
  "quantity_source" TEXT NOT NULL,
  "portion_quantity" REAL NULL CHECK("portion_quantity" > 0.0),
  "portion_unit" TEXT NULL,
  "nutrition_basis" TEXT NULL,
  "reference_basis" TEXT NULL,
  "reference_kcal" REAL NULL,
  "reference_protein_g" REAL NULL,
  "reference_carbs_g" REAL NULL,
  "reference_fat_g" REAL NULL,
  "serving_description" TEXT NULL,
  "serving_grams" REAL NULL,
  "serving_milliliters" REAL NULL,
  "serving_unit" TEXT NULL,
  "density_g_per_ml" REAL NULL,
  "implied_grams" REAL NULL,
  "hand_model_version" INTEGER NULL,
  "origin_pack_id" TEXT NULL,
  "origin_food_id" INTEGER NULL,
  "origin_source" TEXT NULL,
  "origin_source_id" TEXT NULL,
  "fiber_g" REAL NULL,
  "sodium_mg" REAL NULL,
  "alcohol_g" REAL NULL,
  "created_at" INTEGER NOT NULL DEFAULT (CAST(strftime('%s', CURRENT_TIMESTAMP) AS INTEGER)),
  "potassium_mg" REAL NULL,
  "calcium_mg" REAL NULL,
  "iron_mg" REAL NULL,
  "magnesium_mg" REAL NULL,
  "zinc_mg" REAL NULL,
  "vitamin_a_ug" REAL NULL,
  "vitamin_c_mg" REAL NULL,
  "vitamin_d_ug" REAL NULL,
  "vitamin_b12_ug" REAL NULL,
  "folate_ug" REAL NULL,
  "sugars_g" REAL NULL,
  "saturated_fat_g" REAL NULL,
  "cholesterol_mg" REAL NULL,
  "sugar_alcohols_g" REAL NULL,
  "preparation" TEXT NULL,
  "conversion_kind" TEXT NULL,
  "conversion_factor" REAL NULL CHECK("conversion_factor" IS NULL OR "conversion_factor" > 0.0),
  "eaten_at_minute" INTEGER NULL CHECK ("eaten_at_minute" IS NULL OR "eaten_at_minute" BETWEEN 0 AND 1439),
  "logged_meal_key" TEXT NULL,
  "logged_meal_name" TEXT NULL CHECK (("logged_meal_key" IS NULL) = ("logged_meal_name" IS NULL)),
  "evidence_kind" TEXT NULL CHECK ("evidence_kind" IS NULL OR "evidence_kind" IN ('cited', 'matched', 'estimated', 'yours')),
  "evidence_citation" TEXT NULL
);
CREATE INDEX "saved_meal_foods_meal" ON "saved_meal_foods" ("saved_meal_id");
CREATE TABLE "cardio_sessions" (
  "platform_id" TEXT NOT NULL PRIMARY KEY,
  "source_name" TEXT NOT NULL,
  "activity" TEXT NOT NULL CHECK ("activity" IN ('walking', 'running', 'hiking', 'cycling', 'elliptical', 'rowing', 'stairClimbing', 'swimming', 'intervals', 'other')),
  "started_at_ms" INTEGER NOT NULL,
  "ended_at_ms" INTEGER NOT NULL CHECK ("ended_at_ms" > "started_at_ms"),
  "date_epoch_day" INTEGER NOT NULL
);
CREATE TABLE "daily_steps" (
  "epoch_day" INTEGER NOT NULL PRIMARY KEY,
  "steps" INTEGER NOT NULL CHECK ("steps" > 0)
);
`;
