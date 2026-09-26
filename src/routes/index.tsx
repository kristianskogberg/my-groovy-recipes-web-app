import { createFileRoute } from "@tanstack/react-router";
import Recipes from "./recipes";

export const Route = createFileRoute("/")({
  component: Recipes,
});
