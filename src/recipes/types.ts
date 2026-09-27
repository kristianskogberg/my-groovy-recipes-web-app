export type Recipe = {
  id: string;
  name: string;
  servings: number | null;
  time_minutes: number | null;
  calories_per_serving: number | null;
  image_source: "upload" | "preset" | null;
  image_value: string | null;
  tags: string[];
};

export type RecipeDetail = Recipe & {
  description: string | null;
  ingredients: string[];
  steps: string[];
};

export type RecipeResult = {
  recipes: Recipe[];
  imageUrls: Record<string, string>;
};

export type RecipeDetailResult = {
  recipe: RecipeDetail;
  imageUrl?: string;
};

export type RecipeInput = Pick<
  RecipeDetail,
  | "name"
  | "description"
  | "servings"
  | "time_minutes"
  | "calories_per_serving"
  | "ingredients"
  | "steps"
  | "tags"
>;

export type RecipeImageInput =
  | { type: "keep" }
  | { type: "remove" }
  | { type: "preset"; value: string }
  | { type: "upload"; file: File };
