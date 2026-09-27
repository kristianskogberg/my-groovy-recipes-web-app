import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import RecipeCard from "../components/recipe.card";
import { Check, Funnel, Plus, Search, X } from "lucide-react";
import { Modal } from "../components/modal";
import { useCurrentUserId } from "../hooks/useCurrentUserId";
import { recipeListQueryOptions } from "../recipes/queries";

/**
 * A page component that displays a list of recipes for the current user.
 * Uses Supabase and Tanstack Query to fetch recipes and manage loading and error states.
 * @returns A React component that renders the recipes page.
 */
export default function RecipesPage() {
  const userId = useCurrentUserId();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const recipesQuery = useQuery({
    ...recipeListQueryOptions(userId ?? ""),
    enabled: Boolean(userId),
  });

  const isLoading =
    userId === undefined || (userId !== null && recipesQuery.isPending);
  const recipes = recipesQuery.data?.recipes ?? [];
  const availableTags = [
    ...new Set(recipes.flatMap((recipe) => recipe.tags)),
  ].sort((a, b) => a.localeCompare(b));
  const searchTerm = search.trim().toLocaleLowerCase();
  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLocaleLowerCase().includes(searchTerm) &&
      selectedTags.every((tag) => recipe.tags.includes(tag)),
  );

  return (
    <section className="min-h-screen bg-background pb-8 text-foreground">
      <div className="flex items-center justify-between gap-4">
        <h1>My Recipes</h1>
        {userId && (
          <Link to="/recipes/new" className="button">
            <Plus />
            New Recipe
          </Link>
        )}
      </div>

      {userId && recipesQuery.isSuccess && recipes.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60"
              />
              <input
                id="recipe-search"
                type="search"
                aria-label="Search recipes by name"
                className="input pl-10"
                placeholder="Search recipes by name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="button button-secondary"
              aria-label={
                selectedTags.length > 0
                  ? `Filters, ${selectedTags.length} selected`
                  : "Filters"
              }
              onClick={() => setShowFilters(true)}
            >
              <Funnel size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Filters</span>
              {selectedTags.length > 0 && <span>({selectedTags.length})</span>}
            </button>
          </div>
          {selectedTags.length > 0 && (
            <div
              role="group"
              aria-label="Active tag filters"
              className="mt-3 flex flex-wrap gap-2"
            >
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-label={`Remove ${tag} filter`}
                  className="tag cursor-pointer items-center gap-2 focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() =>
                    setSelectedTags((current) =>
                      current.filter((item) => item !== tag),
                    )
                  }
                >
                  {tag}
                  <X size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

      {userId &&
        recipesQuery.isSuccess &&
        recipes.length > 0 &&
        filteredRecipes.length === 0 && (
          <div className="mt-3">
            <p>No recipes match your search and filters.</p>
          </div>
        )}

      {userId && recipesQuery.isSuccess && filteredRecipes.length > 0 && (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              imageUrl={recipesQuery.data.imageUrls[recipe.id]}
              userId={userId}
            />
          ))}
        </ul>
      )}

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Recipes"
      >
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-3 font-medium">Tags</legend>
          {availableTags.length === 0 ? (
            <p>No tags available.</p>
          ) : (
            availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  className={`tag cursor-pointer items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary"
                  }`}
                  onClick={() =>
                    setSelectedTags((current) =>
                      current.includes(tag)
                        ? current.filter((item) => item !== tag)
                        : [...current, tag],
                    )
                  }
                >
                  {isSelected && <Check size={14} aria-hidden="true" />}
                  {tag}
                </button>
              );
            })
          )}
        </fieldset>
      </Modal>
    </section>
  );
}
