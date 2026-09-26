import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { LogOut } from "lucide-react";
import ThemeSwitcher from "./theme.switcher";

export default function AppHeader() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setIsSignedIn(Boolean(session?.user)),
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setAuthError("");
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) setAuthError(error.message);
  }

  return (
    <header className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background text-foreground">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <img src="/favicon.ico" alt="Logo" className="h-10" />
          <span className="font-display text-xl">My Groovy Recipes</span>
        </Link>
        <nav
          className="flex flex-wrap items-center gap-4"
          aria-label="Main navigation"
        >
          {isSignedIn === false && (
            <>
              <Link to="/login" className="[&.active]:font-bold">
                Log in
              </Link>
              <Link to="/register" className="[&.active]:font-bold">
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
        </nav>
      </div>
      {authError && (
        <p role="alert" className="text-red-700">
          {authError}
        </p>
      )}
    </header>
  );
}
