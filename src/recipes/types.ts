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
