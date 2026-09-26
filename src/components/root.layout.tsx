import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import AppHeader from "./app.header";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="mx-auto w-full max-w-5xl px-3">
        <AppHeader />
        <main>
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </div>
  );
}
