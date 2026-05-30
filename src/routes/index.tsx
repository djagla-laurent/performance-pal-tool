import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gauge, ListChecks, LineChart, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velox — Diagnostic de performance web" },
      { name: "description", content: "Auditez Core Web Vitals, images et scripts. Plan d'action priorisé avec impact SEO estimé." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader authed={false} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Propulsé par Lighthouse & PageSpeed Insights
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            La performance web,<br />
            <span className="text-accent">mesurée et expliquée.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Auditez n'importe quelle URL en quelques secondes. Détectez les goulots d'étranglement Core Web Vitals
            et recevez un plan d'action priorisé avec l'impact SEO estimé.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/login" search={{ mode: "signup" }}>
                Lancer une analyse <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">J'ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gauge, title: "Core Web Vitals", desc: "LCP, INP, CLS, FCP, TBT — mesurés en mobile et desktop." },
            { icon: ListChecks, title: "Plan priorisé", desc: "Opportunités classées par gain de temps de chargement estimé." },
            { icon: LineChart, title: "Historique par projet", desc: "Suivez l'évolution de vos sites au fil du temps." },
            { icon: ShieldCheck, title: "Diagnostic complet", desc: "Images, scripts tiers, JavaScript inutilisé, mise en cache." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Velox · Diagnostic de performance web
      </footer>
    </div>
  );
}
