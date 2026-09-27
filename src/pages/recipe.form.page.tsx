import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUserId } from "../hooks/useCurrentUserId";
import { recipeDetailQueryOptions } from "../recipes/queries";
import RecipeForm from "../components/recipe.form";
import AuthRequired from "../components/auth.required";

/** Shows the shared form for a new recipe. */
export function NewRecipePage() {
  const userId = useCurrentUserId();
  if (userId === undefined) return <p>Loading…</p>;
  if (userId === null) return <AuthRequired />;
  return <RecipeForm userId={userId} />;
}

/** Loads a recipe before showing the shared edit form. */
export function EditRecipePage() {
  const { recipeId } = useParams({ from: "/recipes_/$recipeId/edit" });
  const userId = useCurrentUserId();
  const recipeQuery = useQuery({
    ...recipeDetailQueryOptions(userId ?? "", recipeId),
    enabled: Boolean(userId),
  });

  if (userId === undefined) return <p>Loading recipe…</p>;
  if (userId === null) return <AuthRequired />;
  if (recipeQuery.isPending) return <p>Loading recipe…</p>;
  if (recipeQuery.isError) {
    return (
      <p role="alert">Could not load recipe: {recipeQuery.error.message}</p>
    );
  }
  if (!recipeQuery.data) return <p>Recipe not found.</p>;

  return (
    <RecipeForm key={recipeId} userId={userId} initial={recipeQuery.data} />
  );
}
