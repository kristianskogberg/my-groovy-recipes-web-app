import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Flame, Pencil, Trash2, UserRound } from "lucide-react";
import { useCurrentUserId } from "../hooks/useCurrentUserId";
import {
  recipeDetailQueryOptions,
  recipeListQueryKey,
} from "../recipes/queries";
import type { RecipeResult } from "../recipes/types";
import { SIGNED_IMAGE_REFRESH_MS } from "../recipes/constants";
import { deleteRecipe } from "../recipes/actions";
import { recipeDetailQueryKey } from "../recipes/queries";

/**
 * A page component that displays the details of a single recipe.
 * @returns A React component that renders the recipe page.
 */
export default function RecipePage() {
  const { recipeId } = useParams({ from: "/recipes/$recipeId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(userId!, recipeId),
    onSuccess: async () => {
      if (!userId) return;
      const listKey = recipeListQueryKey(userId);
      queryClient.setQueryData<RecipeResult>(listKey, (previous) => {
        if (!previous) return previous;
        const imageUrls = { ...previous.imageUrls };
        delete imageUrls[recipeId];
        return {
          recipes: previous.recipes.filter((item) => item.id !== recipeId),
          imageUrls,
        };
      });
      await queryClient.invalidateQueries({
        queryKey: listKey,
        refetchType: "none",
      });
      await navigate({ to: "/" });
      queryClient.removeQueries({
        queryKey: recipeDetailQueryKey(userId, recipeId),
        exact: true,
      });
    },
  });

  function handleDelete() {
    if (!userId || deleteMutation.isPending) return;
    if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    deleteMutation.mutate();
  }

  const recipeQuery = useQuery({
    ...recipeDetailQueryOptions(userId ?? "", recipeId),
    enabled: Boolean(userId),
  });

  const listResult = userId
    ? queryClient.getQueryData<RecipeResult>(recipeListQueryKey(userId))
    : undefined;
  const cachedRecipe = listResult?.recipes.find(
    (recipe) => recipe.id === recipeId,
  );
  const notFound = recipeQuery.isSuccess && recipeQuery.data === null;
  const detail = recipeQuery.data || undefined;
  const recipe = notFound ? undefined : (detail?.recipe ?? cachedRecipe);
  const cachedImageUrl = listResult?.imageUrls[recipeId];
  const listImageIsFresh = userId
    ? queryClient
        .getQueryCache()
        .find({ queryKey: recipeListQueryKey(userId), exact: true })
        ?.isStaleByTime(SIGNED_IMAGE_REFRESH_MS) === false
    : false;
  const sameImage =
    !detail ||
    (cachedRecipe?.image_source === detail.recipe.image_source &&
      cachedRecipe?.image_value === detail.recipe.image_value);
  const canReuseCachedImage =
    cachedImageUrl &&
    cachedRecipe &&
    sameImage &&
    (cachedRecipe.image_source !== "upload" || listImageIsFresh);
  const imageUrl = canReuseCachedImage ? cachedImageUrl : detail?.imageUrl;

  return (
    <section className="min-h-screen bg-background pb-8 text-foreground">
      {userId === undefined && <p>Loading recipe…</p>}

      {userId === null && (
        <p>
          <Link to="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to see this recipe.
        </p>
      )}

      {userId && recipeQuery.isError && (
        <p role="alert" className="mb-6 text-red-700">
          Could not load recipe: {recipeQuery.error.message}
        </p>
      )}

      {userId && deleteMutation.isError && (
        <p role="alert" className="mb-6 text-red-700">
          Could not delete recipe: {deleteMutation.error.message}
        </p>
      )}

      {userId && notFound && <p>Recipe not found.</p>}

      {userId && !recipe && !notFound && !recipeQuery.isError && (
        <p>Loading recipe…</p>
      )}

      {userId && recipe && (
        <article className="grid gap-6">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={recipe.name}
              className="aspect-video w-full rounded-lg object-cover"
              height={400}
              width={700}
              loading="eager"
              fetchPriority="high"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1>{recipe.name}</h1>
            <div className="flex gap-2">
              <Link
                to="/recipes/$recipeId/edit"
                params={{ recipeId }}
                className="button"
              >
                <Pencil size={16} aria-hidden="true" />
                Edit
              </Link>
              <button
                type="button"
                className="button button-secondary"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>

          {detail?.recipe.description && <p>{detail.recipe.description}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/70">
            {recipe.servings !== null && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={16} aria-hidden="true" />
                {recipe.servings} servings
              </span>
            )}
            {recipe.time_minutes !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={16} aria-hidden="true" />
                {recipe.time_minutes} min
              </span>
            )}
            {recipe.calories_per_serving !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Flame size={16} aria-hidden="true" />
                {recipe.calories_per_serving} cal
              </span>
            )}
          </div>

          {detail ? (
            <>
              {detail.recipe.ingredients.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold">Ingredients</h2>
                  <ul className="mt-2 list-disc pl-5">
                    {detail.recipe.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient}-${index}`}>{ingredient}</li>
                    ))}
                  </ul>
                </section>
              )}

              {detail.recipe.steps.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold">Steps</h2>
                  <ol className="mt-2 list-decimal space-y-2 pl-5">
                    {detail.recipe.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          ) : (
            recipeQuery.isPending && (
              <p className="text-sm text-foreground/70">
                Loading recipe details…
              </p>
            )
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      )}
    </section>
  );
}
