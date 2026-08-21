import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    ...socialMeta({
      title: "Studio sign in — Slate Safi",
      description: "Sign in to the Slate Safi studio dashboard.",
      path: "/auth",
    }),
    meta: [
      { title: "Studio sign in — Slate Safi" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const fieldClass =
  "w-full rounded-sm border border-input bg-background/60 px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/admin", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setCheckEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-32">
      <p className="eyebrow">Studio access</p>
      <h1 className="mt-4 text-4xl leading-tight">
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h1>

      {checkEmail ? (
        <div className="frame mt-8 rounded-sm border border-primary/40 p-7">
          <p className="font-display text-lg font-bold">Check your email</p>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a confirmation link to {email}. Confirm it, then sign in.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-primary" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-3 ${fieldClass}`}
                placeholder="you@slatesafi.co.ke"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-primary" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-3 ${fieldClass}`}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </>
      )}

      <Link to="/" className="mt-10 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary">
        Back to site
      </Link>
    </div>
  );
}
