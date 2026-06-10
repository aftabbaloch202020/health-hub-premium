import { createServerFn } from "@tanstack/react-start";

export const reminderMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { name?: string; medicine?: string; dosage?: string; instructions?: string; quantity?: string };
    if (!d?.medicine) throw new Error("medicine required");
    return {
      name: String(d.name ?? "there"),
      medicine: String(d.medicine),
      dosage: String(d.dosage ?? ""),
      instructions: String(d.instructions ?? ""),
      quantity: String(d.quantity ?? "1"),
    };
  })
  .handler(async ({ data }): Promise<{ message: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const fallback = `🔔 Hello ${data.name}, it's time to take your ${data.medicine}${data.dosage ? ` ${data.dosage}` : ""}. Please take ${data.quantity} ${data.instructions ? `(${data.instructions})` : ""}.`;
    if (!apiKey) return { message: fallback };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You craft warm, brief medicine reminder messages (1-2 sentences). Always include a friendly bell emoji, the patient name, medicine, dosage, quantity and instructions. No medical advice." },
            { role: "user", content: `Name: ${data.name}; Medicine: ${data.medicine}; Dosage: ${data.dosage}; Quantity: ${data.quantity}; Instructions: ${data.instructions}` },
          ],
        }),
      });
      if (!res.ok) return { message: fallback };
      const j = await res.json();
      const msg = j.choices?.[0]?.message?.content?.trim();
      return { message: msg || fallback };
    } catch {
      return { message: fallback };
    }
  });