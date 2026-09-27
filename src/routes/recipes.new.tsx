import { createFileRoute } from "@tanstack/react-router";
import { NewRecipePage } from "../pages/recipe.form.page";

export const Route = createFileRoute("/recipes/new")({
  component: NewRecipePage,
});
