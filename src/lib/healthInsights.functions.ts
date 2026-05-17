import { createServerFn } from "@tanstack/react-start";

export type VitalEntry = {
  date: string;
  systolic?: number;
  diastolic?: number;
  sugar?: number;
  heartRate?: number;
  oxygen?: number;
  weight?: number;
  symptoms?: string;
};

export type HealthInsight = {
  headline: string;
  trend: "improving" | "stable" | "declining" | "mixed";
  bullets: string[];
  recommendations: string[];
};

export const healthInsights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { entries?: VitalEntry[] };
    if (!Array.isArray(d?.entries)) throw new Error("entries required");
    return { entries: d.entries.slice(-60) };
  })
  .handler(async ({ data }): Promise<HealthInsight> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!data.entries.length) {
      return { headline: "Add a few entries to see your trends.", trend: "stable", bullets: [], recommendations: ["Log your first reading to begin tracking."] };
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are a health trend analyst. Given the JSON array of vitals, return ONLY strict JSON: {"headline": string, "trend":"improving"|"stable"|"declining"|"mixed", "bullets": string[], "recommendations": string[]}. Headline is one friendly sentence like "Your health was stable this week" or "Your blood pressure increased compared to last week." Bullets are 3-5 short observations. Recommendations are 2-4 short actionable tips. Be cautious; do not diagnose.` },
          { role: "user", content: `Vitals JSON: ${JSON.stringify(data.entries)}` },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI gateway ${res.status}`);
    }
    const j = await res.json();
    const raw: string = j.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let p: Partial<HealthInsight> = {};
    try { p = JSON.parse(cleaned); } catch {
      const m = cleaned.match(/\{[\s\S]*\}/); if (m) try { p = JSON.parse(m[0]); } catch { /* */ }
    }
    return {
      headline: String(p.headline ?? "Health summary ready."),
      trend: (["improving","stable","declining","mixed"].includes(String(p.trend)) ? p.trend : "stable") as HealthInsight["trend"],
      bullets: Array.isArray(p.bullets) ? p.bullets.map(String).slice(0, 6) : [],
      recommendations: Array.isArray(p.recommendations) ? p.recommendations.map(String).slice(0, 6) : [],
    };
  });