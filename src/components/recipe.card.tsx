import { Clock, Flame, UserRound } from "lucide-react";
import type { Recipe } from "../recipes/types";

/**
 * A card component that displays a recipe's details (image, name, description, servings, time, calories and tags).
 * @param recipe - The recipe object containing details to be displayed
 * @param imageUrl - Optional URL for the recipe's image
 * @returns A React component that renders the recipe card.
 */
export default function RecipeCard({
  recipe,
  imageUrl,
}: {
  recipe: Recipe;
  imageUrl?: string;
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-border bg-card">
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
      <div className="p-4">
        <h2 className="font-display text-xl font-semibold">{recipe.name}</h2>
        {recipe.description && <p className="">{recipe.description}</p>}
        <div className="flex mt-3 flex-wrap gap-x-4 gap-y-1 text-sm">
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
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-input bg-background py-0.5 pl-2.5 pr-2.5 text-sm text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
