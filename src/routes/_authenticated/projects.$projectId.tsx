import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runAnalysis } from "@/lib/analyses.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Smartphone, Monitor, Trash2, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({ meta: [{ title: "Projet — Velox" }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const runFn = useServerFn(runAnalysis);
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, status, strategy, performance_score, lcp_ms, cls, inp_ms, error, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const runMut = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Projet introuvable");
      return runFn({ data: { projectId, url: project.url, strategy } });
    },
    onSuccess: (res) => {
      toast.success("Analyse terminée");
      qc.invalidateQueries({ queryKey: ["analyses", projectId] });
      navigate({ to: "/analyses/$analysisId", params: { analysisId: res.analysisId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProjectMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Projet supprimé");
      qc.invalidateQueries({ queryKey: ["projects"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!project) {
    return <main className="mx-auto max-w-6xl px-4 py-10"><div className="h-64 animate-pulse rounded-xl bg-card" /></main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Projets
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight">{project.name}</h1>
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
          >
            {project.url} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Button variant="ghost" size="sm" onClick={() => {
          if (confirm("Supprimer ce projet et toutes ses analyses ?")) deleteProjectMut.mutate();
        }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Run analysis card */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Lancer une analyse</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          L'analyse prend généralement 10 à 30 secondes.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-border bg-background p-1">
            <button
              onClick={() => setStrategy("mobile")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                strategy === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
            <button
              onClick={() => setStrategy("desktop")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                strategy === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
          </div>
          <Button onClick={() => runMut.mutate()} disabled={runMut.isPending} className="gap-2">
            <Play className="h-4 w-4" />
            {runMut.isPending ? "Analyse en cours..." : "Lancer l'analyse"}
          </Button>
        </div>
      </div>

      {/* Analyses history */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Historique</h2>
        {isLoading ? (
          <div className="mt-4 space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />)}
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aucune analyse pour l'instant.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Stratégie</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">LCP</th>
                  <th className="px-4 py-3 text-left font-medium">CLS</th>
                  <th className="px-4 py-3 text-left font-medium">INP</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a.id} className="border-t border-border text-sm">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 capitalize">{a.strategy}</td>
                    <td className="px-4 py-3 font-display font-semibold tabular-nums">
                      {a.performance_score ?? "–"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{a.lcp_ms ? `${(a.lcp_ms / 1000).toFixed(1)}s` : "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{a.cls != null ? Number(a.cls).toFixed(2) : "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{a.inp_ms ? `${a.inp_ms}ms` : "–"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === "completed" ? "default" : a.status === "failed" ? "destructive" : "secondary"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "completed" && (
                        <Link
                          to="/analyses/$analysisId"
                          params={{ analysisId: a.id }}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Voir
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
