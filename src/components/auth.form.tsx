import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthMode = "login" | "register";

/**
 * A form component for user authentication (login or registration).
 * @param mode - The mode of the form, either "login" or "register".
 * @returns A React component that renders the authentication form.
 */
export default function AuthForm({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";

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
    <section className="mx-auto max-w-md py-12">
      <h1 className="font-display text-3xl font-bold">
        {isRegistering ? "Create an account" : "Log in"}
      </h1>
      <p className="mt-2">
        {isRegistering ? "Already have an account? " : "New here? "}
        {isRegistering ? (
          <Link to="/login" className="font-semibold underline">
            Log in
          </Link>
        ) : (
          <Link to="/register" className="font-semibold underline">
            Register
          </Link>
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          />
        </label>
        {isRegistering && (
          <label className="flex flex-col gap-1">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}

        <button type="submit" disabled={isSubmitting} className="button">
          {isSubmitting
            ? "Please wait…"
            : isRegistering
              ? "Create account"
              : "Log in"}
        </button>
      </form>
    </section>
  );
}
