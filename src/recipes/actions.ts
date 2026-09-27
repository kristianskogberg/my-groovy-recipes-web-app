import { supabase } from "../lib/supabaseClient";
import type { RecipeDetailResult, RecipeResult } from "./types";
import {
  IMAGE_BUCKET,
  RECIPE_IMAGE_SIGNED_URL_VALID_FOR_SECONDS,
} from "./constants";

/**
 * Fetch recipes for a given user from Supabase
 * @param userId - The ID of the user whose recipes are to be fetched
 * @returns A promise resolving to the fetched recipes and their image URLs
 */
export async function fetchRecipes(userId: string): Promise<RecipeResult> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, name, servings, time_minutes, calories_per_serving, image_source, image_value, tags",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const recipes = data ?? [];
  const uploadPaths = recipes
    .filter((recipe) => recipe.image_source === "upload" && recipe.image_value)
    .map((recipe) => recipe.image_value as string);

  const { data: signedImages } = uploadPaths.length
    ? await supabase.storage
        .from(IMAGE_BUCKET)
        .createSignedUrls(
          uploadPaths,
          RECIPE_IMAGE_SIGNED_URL_VALID_FOR_SECONDS,
        )
    : { data: null };

  const imageUrls: Record<string, string> = {};
  for (const recipe of recipes) {
    if (!recipe.image_value) continue;

    if (recipe.image_source === "upload") {
      const signedUrl = signedImages?.find(
        (image) => image.path === recipe.image_value,
      )?.signedUrl;
      imageUrls[recipe.id] =
        signedUrl ??
        supabase.storage.from(IMAGE_BUCKET).getPublicUrl(recipe.image_value)
          .data.publicUrl;
    } else if (/^(https?:\/\/|\/)/.test(recipe.image_value)) {
      imageUrls[recipe.id] = recipe.image_value;
    }
  }

  return { recipes, imageUrls };
}

export async function fetchRecipe(
  userId: string,
  recipeId: string,
): Promise<RecipeDetailResult | null> {
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(
      "id, name, description, servings, time_minutes, calories_per_serving, image_source, image_value, tags, ingredients, steps",
    )
    .eq("user_id", userId)
    .eq("id", recipeId)
    .maybeSingle();

  if (error) throw error;
  if (!recipe) return null;

  let imageUrl: string | undefined;
  if (recipe.image_value) {
    if (recipe.image_source === "upload") {
      const { data: signedImage } = await supabase.storage
        .from(IMAGE_BUCKET)
        .createSignedUrl(
          recipe.image_value,
          RECIPE_IMAGE_SIGNED_URL_VALID_FOR_SECONDS,
        );
      imageUrl =
        signedImage?.signedUrl ??
        supabase.storage.from(IMAGE_BUCKET).getPublicUrl(recipe.image_value)
          .data.publicUrl;
    } else if (/^(https?:\/\/|\/)/.test(recipe.image_value)) {
      imageUrl = recipe.image_value;
    }
  }

  return { recipe, imageUrl };
}
