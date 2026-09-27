import { supabase } from "../lib/supabaseClient";
import type {
  RecipeDetail,
  RecipeDetailResult,
  RecipeImageInput,
  RecipeInput,
  RecipeResult,
} from "./types";
import {
  IMAGE_BUCKET,
  RECIPE_IMAGE_SIGNED_URL_VALID_FOR_SECONDS,
} from "./constants";
import { optimizeRecipeImage } from "./image";

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

  return { recipe, imageUrl: await getImageUrl(recipe) };
}

async function getImageUrl(recipe: RecipeDetail): Promise<string | undefined> {
  if (recipe.image_value) {
    if (recipe.image_source === "upload") {
      const { data: signedImage } = await supabase.storage
        .from(IMAGE_BUCKET)
        .createSignedUrl(
          recipe.image_value,
          RECIPE_IMAGE_SIGNED_URL_VALID_FOR_SECONDS,
        );
      return (
        signedImage?.signedUrl ??
        supabase.storage.from(IMAGE_BUCKET).getPublicUrl(recipe.image_value)
          .data.publicUrl
      );
    } else if (/^(https?:\/\/|\/)/.test(recipe.image_value)) {
      return recipe.image_value;
    }
  }
}

async function uploadImage(userId: string, file: File): Promise<string> {
  const optimized = await optimizeRecipeImage(file);
  const extension = optimized.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const path = `${userId}/${crypto.randomUUID()}${extension}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, optimized, {
    contentType: optimized.type,
  });
  if (error) throw error;
  return path;
}

async function removeUpload(path: string) {
  try {
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    if (error) console.warn("Could not remove recipe image:", error);
  } catch (error) {
    console.warn("Could not remove recipe image:", error);
  }
}

function validateInput(input: RecipeInput) {
  if (!input.name.trim() || input.ingredients.length === 0) {
    throw new Error("A name and at least one ingredient are required.");
  }
}

/** Creates a recipe and its optional uploaded image. */
export async function createRecipe(
  userId: string,
  input: RecipeInput,
  image: RecipeImageInput,
): Promise<RecipeDetailResult> {
  validateInput(input);
  const uploadPath =
    image.kind === "upload" ? await uploadImage(userId, image.file) : null;
  const imageSource = uploadPath
    ? "upload"
    : image.kind === "preset"
      ? "preset"
      : null;
  const imageValue = uploadPath ?? (image.kind === "preset" ? image.value : null);

  const { data, error } = await supabase
    .from("recipes")
    .insert({ ...input, user_id: userId, image_source: imageSource, image_value: imageValue })
    .select("id, name, description, servings, time_minutes, calories_per_serving, image_source, image_value, tags, ingredients, steps")
    .single();

  if (error || !data) {
    if (uploadPath) await removeUpload(uploadPath);
    throw error ?? new Error("Could not create recipe.");
  }

  return { recipe: data, imageUrl: await getImageUrl(data) };
}

/** Updates one of the user's recipes and replaces its image if requested. */
export async function updateRecipe(
  userId: string,
  recipeId: string,
  input: RecipeInput,
  image: RecipeImageInput,
): Promise<RecipeDetailResult> {
  validateInput(input);
  const { data: previous, error: readError } = await supabase
    .from("recipes")
    .select("image_source, image_value")
    .eq("user_id", userId)
    .eq("id", recipeId)
    .maybeSingle();
  if (readError) throw readError;
  if (!previous) throw new Error("Recipe not found.");

  const uploadPath =
    image.kind === "upload" ? await uploadImage(userId, image.file) : null;
  const imageUpdate =
    image.kind === "keep"
      ? {}
      : {
          image_source: uploadPath ? "upload" : image.kind === "preset" ? "preset" : null,
          image_value: uploadPath ?? (image.kind === "preset" ? image.value : null),
        };
  const { data, error } = await supabase
    .from("recipes")
    .update({ ...input, ...imageUpdate })
    .eq("user_id", userId)
    .eq("id", recipeId)
    .select("id, name, description, servings, time_minutes, calories_per_serving, image_source, image_value, tags, ingredients, steps")
    .maybeSingle();

  if (error || !data) {
    if (uploadPath) await removeUpload(uploadPath);
    throw error ?? new Error("Recipe not found.");
  }

  if (
    image.kind !== "keep" &&
    previous.image_source === "upload" &&
    previous.image_value &&
    previous.image_value !== data.image_value
  ) {
    await removeUpload(previous.image_value);
  }

  return { recipe: data, imageUrl: await getImageUrl(data) };
}

/** Deletes one of the user's recipes and its uploaded image. */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("user_id", userId)
    .eq("id", recipeId)
    .select("image_source, image_value")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Recipe not found.");

  if (data.image_source === "upload" && data.image_value) {
    await removeUpload(data.image_value);
  }
}
