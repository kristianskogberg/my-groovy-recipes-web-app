import { createFileRoute } from "@tanstack/react-router";
import RecipePage from "../pages/recipe.page";

export const Route = createFileRoute("/recipes/$recipeId")({
  component: RecipePage,
});
