import { createFileRoute } from "@tanstack/react-router";
import RecipesPage from "../pages/recipes.page";

export const Route = createFileRoute("/")({
  component: RecipesPage,
});
