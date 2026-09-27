import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { LogOut, Menu, X } from "lucide-react";
import ThemeSwitcher from "./theme.switcher";

/**
 * A header component that displays the app's logo and navigation links.
 * @returns A React component that renders the app header.
 */
export default function AppHeader() {
  const queryClient = useQueryClient();
  const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
  const [authError, setAuthError] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ["recipes"] });
      }
      setIsSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!navigationRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleSignOut() {
    setAuthError("");
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      setAuthError(error.message);
    } else {
      setIsMenuOpen(false);
    }
  }

  return (
    <header className="py-4">
      <div
        ref={navigationRef}
        className="relative flex items-center justify-between gap-2 bg-background text-foreground"
      >
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 font-bold"
          onClick={() => setIsMenuOpen(false)}
        >
          <img src="/favicon.ico" alt="Logo" className="h-10 shrink-0" />
          <span className="truncate font-display text-xl">
            My Groovy Recipes
          </span>
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          className="shrink-0 cursor-pointer rounded-md p-2 hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="header-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav
          id="header-navigation"
          className={`${isMenuOpen ? "flex" : "hidden"} absolute right-0 top-full z-50 mt-2 w-max max-w-[calc(100vw-1.5rem)] flex-col items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-lg md:static md:mt-0 md:flex md:w-auto md:max-w-none md:flex-row md:items-center md:gap-4 md:border-0 md:p-0 md:shadow-none`}
          aria-label="Main navigation"
        >
          {isSignedIn === false && (
            <>
              <Link
                to="/login"
                className="[&.active]:font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="[&.active]:font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
          {isSignedIn && (
            <button
              type="button"
              className="button button-link"
              onClick={handleSignOut}
            >
              <LogOut />
              Sign out
            </button>
          )}
          <ThemeSwitcher />
          {authError && (
            <p
              role="alert"
              className="max-w-full wrap-break-word text-red-700 md:hidden"
            >
              {authError}
            </p>
          )}
        </nav>
      </div>
      {authError && (
        <p role="alert" className="hidden text-red-700 md:block">
          {authError}
        </p>
      )}
    </header>
  );
}
