import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { LogIn, UserRoundPlus } from "lucide-react";

type AuthMode = "login" | "register";

/**
 * A paage component for user authentication (login or registration).
 * @param mode - The mode of the form, either "login" or "register".
 * @returns A React component that renders the authentication form.
 */
export default function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const isRegistering = mode === "register";

  async function handleGoogleSignIn() {
    setError("");
    setMessage("");
    setIsGoogleSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (authError) throw authError;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not start Google sign-in. Please try again.",
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });

        if (authError) throw authError;

        if (!data.session) {
          setMessage("Check your email for a confirmation link, then sign in.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) throw authError;
      }

      await navigate({ to: "/" });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 justify-center p-8">
      <h1>{isRegistering ? "Register" : "Log in"}</h1>
      <p className="">
        {isRegistering ? "Already have an account? " : "New here? "}
        {isRegistering ? (
          <Link to="/login" className="font-semibold underline">
            Log in here
          </Link>
        ) : (
          <Link to="/register" className="font-semibold underline">
            Register here
          </Link>
        )}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input
            id="password"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
          />
        </label>
        {isRegistering && (
          <label className="flex flex-col gap-1">
            <span>Confirm password</span>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}

        <button
          type="submit"
          disabled={isSubmitting || isGoogleSubmitting}
          className="button"
        >
          {isRegistering ? (
            <UserRoundPlus aria-hidden="true" />
          ) : (
            <LogIn aria-hidden="true" />
          )}
          {isSubmitting
            ? "Please wait…"
            : isRegistering
              ? "Create account"
              : "Log in"}
        </button>
      </form>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        className="button button-secondary"
        disabled={isSubmitting || isGoogleSubmitting}
        onClick={handleGoogleSignIn}
      >
        <img
          src="/google-logo.svg"
          alt=""
          aria-hidden="true"
          className="size-5"
        />
        {isGoogleSubmitting ? "Connecting to Google…" : "Continue with Google"}
      </button>
    </section>
  );
}
