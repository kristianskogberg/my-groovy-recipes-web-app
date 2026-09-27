import { useRef, useState, useEffect, type FormEvent } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ImageUp,
  Images,
  X,
  UserRound,
  Flame,
  Clock,
  Bookmark,
} from "lucide-react";
import { updateRecipe, createRecipe } from "../recipes/actions";
import { RECIPE_IMAGE_ACCEPT, isSupportedRecipeImage } from "../recipes/image";
import { recipeDetailQueryKey, recipeListQueryKey } from "../recipes/queries";
import type {
  RecipeDetailResult,
  RecipeImageInput,
  RecipeInput,
  RecipeResult,
} from "../recipes/types";
import InputField from "./input.field";
import { Modal } from "./modal";
import TextAreaField from "./textarea.field";

const imagePresets = [
  "chicken-rice",
  "ice-cream-vanilla",
  "lasagna",
  "macaroni-casserole",
  "meat-potatoes",
  "meatballs-mash",
  "pizza",
] as const;

export default function RecipeForm({
  userId,
  initial,
}: {
  userId: string;
  initial?: RecipeDetailResult;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<RecipeImageInput>({ type: "keep" });
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [showPresets, setShowPresets] = useState(false);
  const [tags, setTags] = useState<string[]>(initial?.recipe.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const mutation = useMutation({
    mutationFn: ({
      input,
      selectedImage,
    }: {
      input: RecipeInput;
      selectedImage: RecipeImageInput;
    }) =>
      initial
        ? updateRecipe(userId, initial.recipe.id, input, selectedImage)
        : createRecipe(userId, input, selectedImage),
    onSuccess: async (result) => {
      const recipeId = result.recipe.id;
      queryClient.setQueryData(recipeDetailQueryKey(userId, recipeId), result);
      const listKey = recipeListQueryKey(userId);
      queryClient.setQueryData<RecipeResult>(listKey, (previous) => {
        if (!previous) return previous;
        const recipe = result.recipe;
        const summary = {
          id: recipe.id,
          name: recipe.name,
          servings: recipe.servings,
          time_minutes: recipe.time_minutes,
          calories_per_serving: recipe.calories_per_serving,
          image_source: recipe.image_source,
          image_value: recipe.image_value,
          tags: recipe.tags,
        };
        const imageUrls = { ...previous.imageUrls };
        if (result.imageUrl) imageUrls[recipeId] = result.imageUrl;
        else delete imageUrls[recipeId];
        return {
          recipes:
            initial && previous.recipes.some((item) => item.id === recipeId)
              ? previous.recipes.map((item) =>
                  item.id === recipeId ? summary : item,
                )
              : [summary, ...previous.recipes],
          imageUrls,
        };
      });
      await queryClient.invalidateQueries({
        queryKey: listKey,
        refetchType: "none",
      });
      await navigate({ to: "/recipes/$recipeId", params: { recipeId } });
    },
  });

  const displayedImage =
    image.type === "upload"
      ? previewUrl
      : image.type === "preset"
        ? image.value
        : image.type === "remove"
          ? undefined
          : (initial?.imageUrl ??
            (initial?.recipe.image_source === "preset"
              ? (initial.recipe.image_value ?? undefined)
              : undefined));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setFormError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const ingredients = String(data.get("ingredients") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!name || ingredients.length === 0) {
      setFormError("Add a name and at least one ingredient.");
      return;
    }

    const numberOrNull = (key: string) => {
      const value = String(data.get(key) ?? "").trim();
      return value === "" ? null : Number(value);
    };
    const input: RecipeInput = {
      name,
      description: String(data.get("description") ?? "").trim() || null,
      servings: numberOrNull("servings"),
      calories_per_serving: numberOrNull("calories_per_serving"),
      time_minutes: numberOrNull("time_minutes"),
      ingredients,
      steps: String(data.get("steps") ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      tags: [...new Set([...tags, tagDraft.trim()].filter(Boolean))],
    };
    mutation.mutate({ input, selectedImage: image });
  }

  function handleCancel() {
    const message = initial
      ? "Discard your unsaved changes to this recipe?"
      : "Discard this new recipe?";
    if (!window.confirm(message)) return;

    if (initial) {
      void navigate({
        to: "/recipes/$recipeId",
        params: { recipeId: initial.recipe.id },
      });
    } else {
      void navigate({ to: "/" });
    }
  }

  return (
    <section className="pb-8 text-foreground">
      <h1>{initial ? "Edit Recipe" : "New Recipe"}</h1>
      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4"
        aria-busy={mutation.isPending}
      >
        <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-4">
          <div>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
              {displayedImage ? (
                <img
                  src={displayedImage}
                  alt="Recipe preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-3">
                  <button
                    type="button"
                    className="button button-secondary bg-background"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageUp size={18} aria-hidden="true" /> Add a photo of your
                    finished recipe
                  </button>
                  <span className="text-sm text-foreground/70">or</span>
                  <button
                    type="button"
                    className="button button-secondary bg-background"
                    onClick={() => setShowPresets(true)}
                  >
                    <Images size={18} aria-hidden="true" /> Choose a preset
                    image
                  </button>
                </div>
              )}
              {displayedImage && (
                <button
                  type="button"
                  className="button button-secondary absolute right-3 top-3"
                  aria-label="Remove image"
                  onClick={() => {
                    setImage({ type: "remove" });
                    setPreviewUrl(undefined);
                  }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={RECIPE_IMAGE_ACCEPT}
              hidden
              aria-label="Upload recipe image"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (!isSupportedRecipeImage(file)) {
                  setFormError(
                    "Choose a JPEG, PNG, WebP, HEIC, HEIF, or AVIF image.",
                  );
                  return;
                }
                setFormError("");
                setImage({ type: "upload", file });
                setPreviewUrl(URL.createObjectURL(file));
                setShowPresets(false);
              }}
            />
          </div>

          <InputField
            label="Name"
            name="name"
            required
            defaultValue={initial?.recipe.name}
          />
          <TextAreaField
            label="Description"
            name="description"
            defaultValue={initial?.recipe.description ?? ""}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField
              label="Servings"
              name="servings"
              type="number"
              min="0.01"
              step="any"
              icon={<UserRound size={16} />}
              defaultValue={initial?.recipe.servings ?? ""}
            />
            <InputField
              label="Calories"
              name="calories_per_serving"
              type="number"
              min="0"
              icon={<Flame size={16} />}
              defaultValue={initial?.recipe.calories_per_serving ?? ""}
            />
            <InputField
              label="Time (minutes)"
              name="time_minutes"
              type="number"
              min="0"
              icon={<Clock size={16} />}
              defaultValue={initial?.recipe.time_minutes ?? ""}
            />
          </div>
          <TextAreaField
            label="Ingredients"
            name="ingredients"
            required
            placeholder="One ingredient per line"
            defaultValue={initial?.recipe.ingredients.join("\n") ?? ""}
          />
          <TextAreaField
            label="Steps"
            name="steps"
            placeholder="One step per line"
            defaultValue={initial?.recipe.steps.join("\n") ?? ""}
          />
          <div className="grid gap-2 text-sm font-medium">
            <label htmlFor="recipe-tags">Tags</label>
            <input
              id="recipe-tags"
              className="input"
              value={tagDraft}
              placeholder="Type a tag, then press comma"
              onChange={(event) => {
                const parts = event.target.value.split(",");
                setTagDraft(parts.pop() ?? "");
                const added = parts.map((part) => part.trim()).filter(Boolean);
                if (added.length) {
                  setTags((current) => [...new Set([...current, ...added])]);
                }
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing)
                  return;
                event.preventDefault();
                const tag = tagDraft.trim();
                if (!tag) return;
                setTags((current) => [...new Set([...current, tag])]);
                setTagDraft("");
              }}
            />
            {tags.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mt-1"
                aria-label="Recipe tags"
              >
                {tags.map((tag) => (
                  <span key={tag} className="tag items-center gap-2">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove ${tag} tag`}
                      className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-primary"
                      onClick={() =>
                        setTags((current) =>
                          current.filter((item) => item !== tag),
                        )
                      }
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {(formError || mutation.error) && (
          <p role="alert" className="text-sm text-red-700">
            {formError || mutation.error?.message}
          </p>
        )}
        <div className="flex gap-3 pb-4">
          <button
            type="button"
            className="button button-secondary shrink-0"
            disabled={mutation.isPending}
            onClick={handleCancel}
          >
            <X size={18} aria-hidden="true" /> Cancel
          </button>
          <button
            type="submit"
            className="button min-w-0 flex-1"
            disabled={mutation.isPending}
          >
            <Bookmark size={18} aria-hidden="true" />
            {mutation.isPending
              ? image.type === "upload"
                ? "Optimizing and saving…"
                : "Saving…"
              : initial
                ? "Save Changes"
                : "Save Recipe"}
          </button>
        </div>
      </form>
      <Modal
        open={showPresets}
        onClose={() => setShowPresets(false)}
        title="Choose a preset image"
      >
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4">
          {imagePresets.map((preset) => {
            const value = `/presets/${preset}.png`;
            return (
              <button
                key={preset}
                type="button"
                aria-label={preset.replaceAll("-", " ")}
                aria-pressed={image.type === "preset" && image.value === value}
                className="overflow-hidden cursor-pointer rounded-md border-2 border-transparent focus-visible:outline-2 focus-visible:outline-primary aria-pressed:border-primary"
                onClick={() => {
                  setImage({ type: "preset", value });
                  setPreviewUrl(undefined);
                  setShowPresets(false);
                }}
              >
                <img
                  src={value}
                  alt=""
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      </Modal>
    </section>
  );
}
