import { Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import AppHeader from "./app.header";

export default function RootLayout() {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div
      className="min-h-dvh bg-background font-body text-foreground"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3">
        <AppHeader />
        <main
          className={`flex flex-1 flex-col ${isAuthPage ? "mt-0" : "mt-[calc(4.75rem+env(safe-area-inset-top))]"}`}
        >
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </div>
  );
}
