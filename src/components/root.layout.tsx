import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import AppHeader from "./app.header";

export default function RootLayout() {
  return (
    <div
      className="min-h-dvh bg-background font-body text-foreground"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3">
        <AppHeader />
        <main className="mt-[calc(4.75rem+env(safe-area-inset-top))] flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </div>
  );
}
