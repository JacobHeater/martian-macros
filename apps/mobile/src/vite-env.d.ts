/// <reference types="vite/client" />

/** Where to read the list of downloadable packs, set for each build (MM-56). */
declare const __MM_FOOD_PACK_MANIFEST_URL__: string;

/** A FoodData Central API key for the online lookup (MM-58), or empty when the build has none. */
declare const __MM_FDC_API_KEY__: string;

/** Whether this build starts from the demo scenario on every launch (`mm demo --seed`, MM-177). */
declare const __MM_DEMO_SEED__: boolean;
/** Which identity the shell has (MM-8): "prod", "dev" or "demo". */
declare const __MM_IDENTITY__: string;
