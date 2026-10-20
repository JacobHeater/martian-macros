/**
 * The figures of the online food lookup (MM-58): the services asked, what
 * they ask of a client, and how the app spaces its requests. Open Food Facts
 * allows 15 product reads and 10 searches a minute per address and asks for
 * a User-Agent naming the app; FoodData Central allows 1,000 requests an
 * hour per key. A request is never made unless the person allowed it.
 */
export const OnlineSourceRule = {
  /** How the app names itself to Open Food Facts, as its API etiquette asks (the repository, not a person). */
  userAgent: 'MartianMacros/1.0 (https://github.com/JacobHeater/martian-macros)',
  openFoodFacts: {
    product: 'https://world.openfoodfacts.org/api/v2/product/',
    search: 'https://world.openfoodfacts.org/cgi/search.pl',
    /** 15 a minute: at least this long between two product reads. */
    productSpacingMs: 4_000,
    /** 10 a minute: at least this long between two searches. */
    searchSpacingMs: 6_000,
    /** The fields asked for, so the answer stays small. */
    fields:
      'code,product_name,brands,nutriments,serving_size,serving_quantity,nutrition_data_per,countries_tags,last_modified_t',
  },
  foodDataCentral: {
    search: 'https://api.nal.usda.gov/fdc/v1/foods/search',
    spacingMs: 1_000,
  },
  /** How many foods one online search brings back at most. */
  searchLimit: 20,
} as const;
