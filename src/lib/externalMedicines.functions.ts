import { createServerFn } from "@tanstack/react-start";

export type ExternalMedicine = {
  id: string;
  name: string;
  image_url: string | null;
  price_pkr: number | null;
  availability: string;
  source_url: string;
  last_seen_at: string;
};

export const listExternalMedicines = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ medicines: ExternalMedicine[]; lastSyncAt: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("external_medicines")
      .select("id, name, image_url, price_pkr, availability, source_url, last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const meds = (data ?? []) as ExternalMedicine[];
    const lastSyncAt = meds.length > 0 ? meds[0].last_seen_at : null;
    return { medicines: meds, lastSyncAt };
  },
);

export const triggerSync = createServerFn({ method: "POST" }).handler(async () => {
  const { runTimemedicoSync } = await import("@/lib/sync-medicines.server");
  return await runTimemedicoSync();
});