import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScoreGauge } from "@/components/ScoreGauge";
import {
  MetricCard, classifyLCP, classifyCLS, classifyINP, classifyFCP, classifyTBT,
} from "@/components/MetricCard";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Zap, ExternalLink, Smartphone, Monitor } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analyses/$analysisId")({
  head: () => ({ meta: [{ title: "Rapport — Velox" }] }),
  component: AnalysisPage,
});

type Opportunity = {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  savingsMs?: number;
  score: number | null;
};

function fmtMs(ms: number | null) {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}`;
  return (ms / 1000).toFixed(2);
}

function AnalysisPage() {
  const { analysisId } = Route.useParams();

  const { data: a, isLoading } = useQuery({
    queryKey: ["analysis", analysisId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses").select("*").eq("id", analysisId).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => query.state.data?.status === "pending" ? 3000 : false,
  });

  if (isLoading || !a) {
    return <main className="mx-auto max-w-6xl px-4 py-10"><div className="h-96 animate-pulse rounded-xl bg-card" /></main>;
  }

  const opps = (a.opportunities as unknown as Opportunity[] | null) ?? [];
  const totalSavings = opps.reduce((s, o) => s + (o.savingsMs ?? 0), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to="/projects/$projectId"
        params={{ projectId: a.project_id }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Projet
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 capitalize">
              {a.strategy === "mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
              {a.strategy}
            </span>
            <span>{new Date(a.created_at).toLocaleString("fr-FR")}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Rapport de performance</h1>
          <a href={a.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
            {a.url} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {a.status !== "completed" && (
        <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm shadow-sm">
          <div className="font-medium text-foreground">
            {a.status === "failed" ? "Analyse échouée" : "Analyse en cours"}
          </div>
          <p className="mt-1 text-muted-foreground">
            {a.status === "failed"
              ? a.error ?? "L'analyse n'a pas pu être finalisée. Relancez-la depuis le projet."
              : "Les métriques apparaîtront automatiquement dès que le rapport sera terminé."}
          </p>
        </div>
      )}

      {/* Header score + summary */}
      <div className="mt-8 grid gap-6 rounded-xl border border-border bg-card p-8 shadow-sm md:grid-cols-[auto_1fr]">
        <ScoreGauge score={a.performance_score} label="Performance" size="lg" />
        <div className="flex flex-col justify-center gap-3">
          <p className="text-sm text-muted-foreground">
            Score Lighthouse calculé à partir des Core Web Vitals et autres métriques de performance.
          </p>
          {totalSavings > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm">
              <Zap className="h-4 w-4 text-warning" />
              <span>
                <strong className="tabular-nums">{(totalSavings / 1000).toFixed(1)}s</strong> d'économie potentielle
                en appliquant les recommandations ci-dessous.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Core Web Vitals */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Core Web Vitals</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="LCP" value={fmtMs(a.lcp_ms)} unit="s" status={classifyLCP(a.lcp_ms)} description="Largest Contentful Paint" />
          <MetricCard label="INP" value={a.inp_ms} unit="ms" status={classifyINP(a.inp_ms)} description="Interaction to Next Paint" />
          <MetricCard label="CLS" value={a.cls != null ? Number(a.cls).toFixed(3) : null} status={classifyCLS(a.cls != null ? Number(a.cls) : null)} description="Cumulative Layout Shift" />
          <MetricCard label="FCP" value={fmtMs(a.fcp_ms)} unit="s" status={classifyFCP(a.fcp_ms)} description="First Contentful Paint" />
          <MetricCard label="TBT" value={a.tbt_ms} unit="ms" status={classifyTBT(a.tbt_ms)} description="Total Blocking Time" />
          <MetricCard label="Speed Index" value={fmtMs(a.speed_index_ms)} unit="s" description="Vitesse de rendu visuel" />
        </div>
      </section>

      {/* Opportunities */}
      {opps.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Plan d'action priorisé</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Classé par gain de temps de chargement estimé. Améliorer ces points renforce votre référencement.
          </p>
          <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
            <Accordion type="multiple" className="divide-y divide-border">
              {opps.map((o, i) => (
                <AccordionItem key={o.id} value={o.id} className="border-0 px-5">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center gap-4 pr-4 text-left">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-accent">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{o.title}</div>
                        {o.displayValue && <div className="text-xs text-muted-foreground">{o.displayValue}</div>}
                      </div>
                      {o.savingsMs ? (
                        <span className="flex-none rounded-md bg-warning/10 px-2 py-1 text-xs font-semibold text-warning tabular-nums">
                          -{(o.savingsMs / 1000).toFixed(2)}s
                        </span>
                      ) : null}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="prose prose-sm max-w-none text-sm text-muted-foreground [&_a]:text-accent [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(o.description) }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Diagnostics */}
      {a.diagnostics && Array.isArray(a.diagnostics) && a.diagnostics.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Diagnostics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(a.diagnostics as any[]).map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-card p-4 text-sm shadow-sm">
                <div className="font-medium">{d.title}</div>
                {d.displayValue && <div className="mt-1 text-xs text-muted-foreground">{d.displayValue}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// Lighthouse descriptions are markdown-ish; render basic links + code.
function renderMarkdown(s: string): string {
  if (!s) return "";
  const escaped = s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
