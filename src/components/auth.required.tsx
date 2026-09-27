import { Link } from "@tanstack/react-router";

export default function AuthRequired() {
  return (
    <p>
      <Link to="/login" className="font-semibold underline">
        Log in
      </Link>{" "}
      to manage your recipes.
    </p>
  );
}
