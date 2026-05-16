import { createServerFn } from "@tanstack/react-start";

export type ReportFinding = {
  title: string;
  description: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  confidence: number;
};

export type ReportResult = {
  reportType: string;
  summary: string;
  findings: ReportFinding[];
  abnormalities: string[];
  riskLevel: "low" | "moderate" | "high";
  recommendations: string[];
  nextSteps: string[];
  overallConfidence: number;
};

const SYSTEM = `You are a senior medical imaging and lab-report analysis assistant. Analyze the uploaded medical document (X-ray, MRI, CT scan, blood test, lab report, prescription, etc.) and produce a structured, professional health report.

Return ONLY strict minified JSON (no markdown, no prose) matching this shape:
{
  "reportType": string,                          // e.g. "Chest X-Ray", "CBC Blood Test", "MRI Brain"
  "summary": string,                             // 2-3 sentence plain-language overview
  "findings": [
    { "title": string, "description": string, "severity": "normal"|"mild"|"moderate"|"severe", "confidence": number }
  ],
  "abnormalities": string[],                     // short bullets of abnormal items
  "riskLevel": "low"|"moderate"|"high",
  "recommendations": string[],                   // lifestyle / medication / follow-up
  "nextSteps": string[],                         // concrete actions (consult cardiologist, repeat test in 3 months, etc.)
  "overallConfidence": number                    // 0-100
}

Confidence values are 0-100 integers. Be cautious, conservative, and clinically accurate. If the image is unreadable or not a medical document, return reportType "Unrecognized" with an explanatory summary and empty arrays.`;

export const analyzeReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { imageDataUrl?: string; note?: string };
    if (!d?.imageDataUrl || typeof d.imageDataUrl !== "string") {
      throw new Error("imageDataUrl is required");
    }
    return { imageDataUrl: d.imageDataUrl, note: typeof d.note === "string" ? d.note.slice(0, 500) : "" };
  })
  .handler(async ({ data }): Promise<ReportResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this medical report and return the JSON described.${data.note ? ` Patient note: ${data.note}` : ""}` },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI gateway ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: Partial<ReportResult> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { /* fall through */ }
      }
    }

    const findings = Array.isArray(parsed.findings) ? parsed.findings.slice(0, 12).map((f) => ({
      title: String(f?.title ?? "Finding"),
      description: String(f?.description ?? ""),
      severity: (["normal","mild","moderate","severe"].includes(String(f?.severity)) ? f!.severity : "mild") as ReportFinding["severity"],
      confidence: Math.max(0, Math.min(100, Number(f?.confidence ?? 70))),
    })) : [];

    return {
      reportType: String(parsed.reportType ?? "Medical Report"),
      summary: String(parsed.summary ?? "Analysis complete."),
      findings,
      abnormalities: Array.isArray(parsed.abnormalities) ? parsed.abnormalities.map(String).slice(0, 10) : [],
      riskLevel: (["low","moderate","high"].includes(String(parsed.riskLevel)) ? parsed.riskLevel : "low") as ReportResult["riskLevel"],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String).slice(0, 10) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String).slice(0, 10) : [],
      overallConfidence: Math.max(0, Math.min(100, Number(parsed.overallConfidence ?? 75))),
    };
  });