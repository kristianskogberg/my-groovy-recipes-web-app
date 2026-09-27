import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "../pages/auth.page";

export const Route = createFileRoute("/register")({
  component: () => <AuthPage mode="register" />,
});
