import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Kanto Motion" },
      { name: "description", content: "Sign in to Kanto Motion" },
      { property: "og:title", content: "Sign In — Kanto Motion" },
      { property: "og:description", content: "Sign in to Kanto Motion" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Tab = "sign-in" | "sign-up";

function AuthPage() {
  const [tab, setTab] = useState<Tab>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (tab === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (signInError) {
        setError(signInError.message);
      } else {
        navigate({ to: "/dashboard" });
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setIsLoading(false);
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Check your email to confirm your account.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-md items-center px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Kanto Motion</h1>
        <p className="mb-8 text-muted-foreground">
          {tab === "sign-in" ? "Welcome back." : "Create an account to get started."}
        </p>

        <div className="mb-6 grid grid-cols-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("sign-in")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "sign-in" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
            {tab === "sign-in" && <div className="mt-2 h-0.5 bg-primary" />}
          </button>
          <button
            type="button"
            onClick={() => setTab("sign-up")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "sign-up" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
            {tab === "sign-up" && <div className="mt-2 h-0.5 bg-primary" />}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-destructive px-4 py-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 rounded-md border border-primary px-4 py-3 text-sm text-primary-foreground">
            {message}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (tab === "sign-in" ? "Signing in..." : "Signing up...") : tab === "sign-in" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Continue with Google
        </button>
      </main>
    </div>
  );
}
