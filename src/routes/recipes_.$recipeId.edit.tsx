import { createFileRoute } from "@tanstack/react-router";
import { EditRecipePage } from "../pages/recipe.form.page";

export const Route = createFileRoute("/recipes_/$recipeId/edit")({
  component: EditRecipePage,
});
