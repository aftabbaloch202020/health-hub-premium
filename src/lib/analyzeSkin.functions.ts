import { createServerFn } from "@tanstack/react-start";

export type SkinFinding = {
  condition: string;
  description: string;
  severity: "mild" | "moderate" | "severe";
  confidence: number;
};

export type SkinReport = {
  bodyArea: string;
  summary: string;
  findings: SkinFinding[];
  treatments: string[];
  skincare: string[];
  medicineKeywords: string[];
  urgency: "self-care" | "see-doctor-soon" | "urgent";
  overallConfidence: number;
};

const SYS = `You are a dermatology triage assistant. Look at the uploaded image of skin, face, hands, nails, or body and produce a structured assessment.

Return ONLY strict minified JSON matching:
{
  "bodyArea": string,
  "summary": string,
  "findings": [{"condition": string, "description": string, "severity": "mild"|"moderate"|"severe", "confidence": number}],
  "treatments": string[],
  "skincare": string[],
  "medicineKeywords": string[],
  "urgency": "self-care"|"see-doctor-soon"|"urgent",
  "overallConfidence": number
}

medicineKeywords should be short generic OTC product names a pharmacy stocks (e.g. "Fucidin", "Betnovate", "Canesten", "Hydrocortisone", "Xyzal"). Confidence values are 0-100 integers. Be conservative. If image is not a body/skin area, set bodyArea "Unrecognized" and findings []. Never claim certainty — this is informational only.`;

export const analyzeSkin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { imageDataUrl?: string; note?: string };
    if (!d?.imageDataUrl || typeof d.imageDataUrl !== "string") throw new Error("imageDataUrl required");
    return { imageDataUrl: d.imageDataUrl, note: typeof d.note === "string" ? d.note.slice(0, 300) : "" };
  })
  .handler(async ({ data }): Promise<SkinReport> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: [
            { type: "text", text: `Analyze this skin/body image.${data.note ? ` Patient note: ${data.note}` : ""}` },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ]},
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI gateway ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let p: Partial<SkinReport> = {};
    try { p = JSON.parse(cleaned); } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) try { p = JSON.parse(m[0]); } catch { /* */ }
    }
    const findings = Array.isArray(p.findings) ? p.findings.slice(0, 8).map((f) => ({
      condition: String(f?.condition ?? "Possible condition"),
      description: String(f?.description ?? ""),
      severity: (["mild","moderate","severe"].includes(String(f?.severity)) ? f!.severity : "mild") as SkinFinding["severity"],
      confidence: Math.max(0, Math.min(100, Number(f?.confidence ?? 60))),
    })) : [];
    return {
      bodyArea: String(p.bodyArea ?? "Skin"),
      summary: String(p.summary ?? "Analysis complete."),
      findings,
      treatments: Array.isArray(p.treatments) ? p.treatments.map(String).slice(0, 8) : [],
      skincare: Array.isArray(p.skincare) ? p.skincare.map(String).slice(0, 8) : [],
      medicineKeywords: Array.isArray(p.medicineKeywords) ? p.medicineKeywords.map(String).slice(0, 10) : [],
      urgency: (["self-care","see-doctor-soon","urgent"].includes(String(p.urgency)) ? p.urgency : "self-care") as SkinReport["urgency"],
      overallConfidence: Math.max(0, Math.min(100, Number(p.overallConfidence ?? 65))),
    };
  });