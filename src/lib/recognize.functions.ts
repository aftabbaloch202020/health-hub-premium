import { createServerFn } from "@tanstack/react-start";

export const recognizeMedicine = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { imageDataUrl?: string };
    if (!d?.imageDataUrl || typeof d.imageDataUrl !== "string") {
      throw new Error("imageDataUrl is required");
    }
    return { imageDataUrl: d.imageDataUrl };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a pharmacy OCR assistant. Look at the image (a medicine box, strip, bottle, or doctor's prescription) and extract the medicine brand/product names you can see. Return ONLY a strict JSON object: {\"medicines\": string[]}. Each entry should be a short product name (e.g. 'Panadol', 'Augmentin', 'Ventolin'). If nothing readable, return {\"medicines\": []}. No prose, no markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract medicine names from this image." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway ${res.status}: ${t}`);
    }
    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let medicines: string[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed?.medicines)) {
        medicines = parsed.medicines.filter((s: unknown) => typeof s === "string");
      }
    } catch {
      medicines = cleaned
        .split(/[\n,]+/)
        .map((s) => s.replace(/[^A-Za-z0-9 \-]/g, "").trim())
        .filter(Boolean);
    }
    return { medicines };
  });