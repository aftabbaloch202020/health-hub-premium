import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant"; content: string };

export const askPharmacist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { messages?: Msg[] };
    if (!Array.isArray(d?.messages)) throw new Error("messages required");
    return { messages: d.messages.slice(-20) };
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
              "You are Darman STORE's friendly licensed pharmacist assistant. Answer briefly and clearly about medicines, dosage, side effects, drug interactions, and general wellness. Use simple language. When the question is serious, urgent, or requires diagnosis, advise the user to consult a doctor. Never invent prescription details. Use short paragraphs and bullet points. Reply in the same language the user used (English or Urdu).",
          },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) return { reply: "I'm getting many questions right now. Please try again in a moment." };
      if (res.status === 402) return { reply: "Pharmacist service is temporarily unavailable. Please try later." };
      throw new Error(`AI gateway ${res.status}: ${t}`);
    }
    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a reply.";
    return { reply };
  });