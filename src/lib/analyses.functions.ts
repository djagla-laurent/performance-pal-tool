/**
 * Server function that runs a PageSpeed Insights analysis for a given URL and project,
 * stores the result in the analyses table, and returns the analysis ID.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  url: z.string().url().max(2048),
  strategy: z.enum(["mobile", "desktop"]).default("mobile"),
});

type Opportunity = {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  savingsMs?: number;
  score: number | null;
};

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify project ownership (RLS will also enforce this)
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", data.projectId)
      .single();
    if (projErr || !project) throw new Error("Project not found");

    // Insert pending row
    const { data: pending, error: insertErr } = await supabase
      .from("analyses")
      .insert({
        project_id: data.projectId,
        user_id: userId,
        url: data.url,
        strategy: data.strategy,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertErr || !pending) throw new Error(insertErr?.message ?? "Failed to create analysis");

    const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    apiUrl.searchParams.set("url", data.url);
    apiUrl.searchParams.set("strategy", data.strategy);
    apiUrl.searchParams.append("category", "performance");
    const apiKey = process.env.PAGESPEED_API_KEY ?? "AIzaSyDbrtfhpQevNLfrSI4ikniNsAN3MaiXHS8";
    if (apiKey) apiUrl.searchParams.set("key", apiKey);

    try {
      const res = await fetch(apiUrl.toString());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PageSpeed API ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = await res.json() as any;
      const lh = json.lighthouseResult;
      if (!lh) throw new Error("No Lighthouse result returned");

      const audits = lh.audits ?? {};
      const score = lh.categories?.performance?.score;
      const num = (k: string): number | null => {
        const v = audits[k]?.numericValue;
        return typeof v === "number" ? Math.round(v) : null;
      };

      const opportunities: Opportunity[] = Object.values(audits)
        .filter((a: any) => a?.details?.type === "opportunity" && (a.numericValue ?? 0) > 0)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          displayValue: a.displayValue,
          savingsMs: Math.round(a.numericValue ?? 0),
          score: a.score ?? null,
        }))
        .sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0))
        .slice(0, 20);

      const diagnostics = Object.values(audits)
        .filter((a: any) => a?.details?.type === "diagnostic" || (a.scoreDisplayMode === "informative" && a.score === null))
        .slice(0, 15)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          displayValue: a.displayValue,
        }));

      const cls = audits["cumulative-layout-shift"]?.numericValue;

      const { error: updErr } = await supabase
        .from("analyses")
        .update({
          status: "completed",
          performance_score: score != null ? Math.round(score * 100) : null,
          lcp_ms: num("largest-contentful-paint"),
          inp_ms: num("interaction-to-next-paint") ?? num("experimental-interaction-to-next-paint"),
          cls: typeof cls === "number" ? Number(cls.toFixed(3)) : null,
          fcp_ms: num("first-contentful-paint"),
          tbt_ms: num("total-blocking-time"),
          speed_index_ms: num("speed-index"),
          opportunities,
          diagnostics,
        })
        .eq("id", pending.id);
      if (updErr) throw new Error(updErr.message);

      return { analysisId: pending.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      await supabase
        .from("analyses")
        .update({ status: "failed", error: message })
        .eq("id", pending.id);
      throw new Error(message);
    }
  });
