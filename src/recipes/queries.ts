import { queryOptions } from "@tanstack/react-query";
import { fetchRecipe, fetchRecipes } from "./actions";
import { SIGNED_IMAGE_REFRESH_MS, STALE_TIME_MS } from "./constants";

/** Returns the cache key for one user's recipe list. */
export function recipeListQueryKey(userId: string) {
  return ["recipes", userId, "list"] as const;
}

/** Configures the recipe list query and its refresh schedule. */
export function recipeListQueryOptions(userId: string) {
  return queryOptions({
    queryKey: recipeListQueryKey(userId),
    queryFn: () => fetchRecipes(userId),
    staleTime: STALE_TIME_MS,
    refetchInterval: SIGNED_IMAGE_REFRESH_MS,
  });
}

/** Configures a user's single-recipe query and its refresh schedule. */
export function recipeDetailQueryOptions(userId: string, recipeId: string) {
  return queryOptions({
    queryKey: ["recipes", userId, "detail", recipeId] as const,
    queryFn: () => fetchRecipe(userId, recipeId),
    staleTime: STALE_TIME_MS,
    refetchInterval: SIGNED_IMAGE_REFRESH_MS,
  });
}
