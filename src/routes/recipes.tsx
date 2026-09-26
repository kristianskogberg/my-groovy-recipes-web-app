import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { RecipeResult } from "../types/recipe";
import { Clock, Flame, Plus, UserRound } from "lucide-react";

const IMAGE_BUCKET = "recipe-images";

function RecipeImage({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex aspect-video items-center justify-center overflow-hidden rounded-t-lg bg-background text-sm text-foreground/60">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>No image</span>
      )}
    </div>
  );
}

export default function Recipes() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [result, setResult] = useState<RecipeResult | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setResult(null);
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    void supabase
      .from("recipes")
      .select(
        "id, name, description, servings, time_minutes, calories_per_serving, image_source, image_value, tags",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        const recipes = data ?? [];
        const uploadPaths = recipes
          .filter(
            (recipe) => recipe.image_source === "upload" && recipe.image_value,
          )
          .map((recipe) => recipe.image_value as string);

        const { data: signedImages } = uploadPaths.length
          ? await supabase.storage
              .from(IMAGE_BUCKET)
              .createSignedUrls(uploadPaths, 60 * 60)
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
              supabase.storage
                .from(IMAGE_BUCKET)
                .getPublicUrl(recipe.image_value).data.publicUrl;
          } else if (/^(https?:\/\/|\/)/.test(recipe.image_value)) {
            imageUrls[recipe.id] = recipe.image_value;
          }
        }

        if (!cancelled) {
          setResult({
            userId,
            recipes,
            imageUrls,
            error: error?.message ?? null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const currentResult = result?.userId === userId ? result : null;
  const isLoading = userId === undefined || (userId !== null && !currentResult);
  const recipes = currentResult?.recipes ?? [];

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

      {currentResult?.error && (
        <p role="alert" className="mt-6 text-red-700">
          Could not load recipes: {currentResult.error}
        </p>
      )}

      {userId &&
        currentResult &&
        !currentResult.error &&
        recipes.length === 0 && (
          <p className="mt-6">You have no recipes yet.</p>
        )}

      {userId &&
        currentResult &&
        !currentResult.error &&
        recipes.length > 0 && (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <li
                key={recipe.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <RecipeImage
                  key={currentResult.imageUrls[recipe.id] ?? recipe.id}
                  src={currentResult.imageUrls[recipe.id]}
                  name={recipe.name}
                />
                <div className="p-4">
                  <h2 className="font-display text-xl font-semibold">
                    {recipe.name}
                  </h2>
                  {recipe.description && (
                    <p className="">{recipe.description}</p>
                  )}
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
            ))}
          </ul>
        )}
    </section>
  );
}
