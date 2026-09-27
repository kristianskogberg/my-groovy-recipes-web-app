import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Flame, UserRound } from "lucide-react";
import type { Recipe } from "../recipes/types";
import { recipeDetailQueryOptions } from "../recipes/queries";

/**
 * A card component that displays a recipe's summary (image, name, servings, time, calories and tags).
 * @param recipe - The recipe object containing details to be displayed
 * @param imageUrl - Optional URL for the recipe's image
 * @param userId - The current user, used to prefetch this recipe's details
 * @returns A React component that renders the recipe card.
 */
export default function RecipeCard({
  recipe,
  imageUrl,
  userId,
}: {
  recipe: Recipe;
  imageUrl?: string;
  userId: string;
}) {
  const queryClient = useQueryClient();

  function prefetchRecipe() {
    void queryClient
      .query(recipeDetailQueryOptions(userId, recipe.id))
      .catch(() => {});
  }

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-card">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onMouseEnter={prefetchRecipe}
        onFocus={prefetchRecipe}
        onTouchStart={prefetchRecipe}
      >
        {/* Recipe image */}
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-t-lg bg-background text-sm text-foreground/60">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={recipe.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>No image</span>
          )}
        </div>

        {/* Recipe details */}
        <div className="p-4 flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold">{recipe.name}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {recipe.servings !== null && (
              <span className="flex items-center gap-1.5">
                <UserRound size={16} />
                {recipe.servings} servings
              </span>
            )}
            {recipe.time_minutes !== null && (
              <span className="flex items-center gap-1.5">
                <Clock size={16} />
                {recipe.time_minutes} min
              </span>
            )}
            {recipe.calories_per_serving !== null && (
              <span className="flex items-center gap-1.5 text-sm">
                <Flame size={16} />
                {recipe.calories_per_serving} cal
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
