/** How long a Supabase signed recipe-image URL remains valid after creation. */
export const RECIPE_IMAGE_SIGNED_URL_VALID_FOR_SECONDS = 60 * 60;

/** Refresh and reuse signed image URLs only within their one-hour lifetime. */
export const SIGNED_IMAGE_REFRESH_MS = 50 * 60 * 1000;

/** How long the query cache is considered up to date before it's considered stale. */
export const STALE_TIME_MS = 5 * 60 * 1000;

/** The Supabase storage bucket name for recipe images. */
export const IMAGE_BUCKET = "recipe-images";
