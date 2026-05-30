import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { Activity, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppHeader({ authed }: { authed: boolean }) {
  const navigate = useNavigate();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Velox</span>
        </Link>
        <nav className="flex items-center gap-1">
          {authed ? (
            <>
              <Button asChild variant={path.startsWith("/dashboard") ? "secondary" : "ghost"} size="sm">
                <Link to="/dashboard">Tableau de bord</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/login" search={{ mode: "signup" }}>Commencer</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
