import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import RecipeCard from "../components/recipe.card";
import { Plus } from "lucide-react";
import { useCurrentUserId } from "../hooks/useCurrentUserId";
import { recipeListQueryOptions } from "../recipes/queries";

/**
 * A page component that displays a list of recipes for the current user.
 * Uses Supabase and Tanstack Query to fetch recipes and manage loading and error states.
 * @returns A React component that renders the recipes page.
 */
export default function RecipesPage() {
  const userId = useCurrentUserId();

  const recipesQuery = useQuery({
    ...recipeListQueryOptions(userId ?? ""),
    enabled: Boolean(userId),
  });

  const isLoading =
    userId === undefined || (userId !== null && recipesQuery.isPending);
  const recipes = recipesQuery.data?.recipes ?? [];

  return (
    <section className="min-h-screen bg-background py-8 text-foreground">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl font-bold">My Recipes</h1>
        {userId && (
          <button type="button" className="button">
            <Plus />
            Add recipe
          </button>
        )}
      </div>

      {isLoading && <p className="mt-6">Loading recipes…</p>}

      {userId === null && (
        <p className="mt-6">
          <Link to="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to see your recipes.
        </p>
      )}

      {userId && recipesQuery.isError && (
        <p role="alert" className="mt-6 text-red-700">
          Could not load recipes: {recipesQuery.error.message}
        </p>
      )}

      {userId && recipesQuery.isSuccess && recipes.length === 0 && (
        <p className="mt-6">You have no recipes yet.</p>
      )}

      {userId && recipesQuery.isSuccess && recipes.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              imageUrl={recipesQuery.data.imageUrls[recipe.id]}
              userId={userId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
