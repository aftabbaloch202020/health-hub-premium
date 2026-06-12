import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MedicineRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_pkr: number;
  old_price_pkr: number | null;
  stock: number;
  image: string | null;
  description: string | null;
  prescription_required: boolean;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicineInput = {
  id?: string;
  name: string;
  brand?: string;
  category?: string;
  price_pkr: number;
  old_price_pkr?: number | null;
  stock?: number;
  image?: string | null;
  description?: string | null;
  prescription_required?: boolean;
  rating?: number;
  is_active?: boolean;
};

async function assertAdmin(context: any) {
  const { data: roles } = await context.supabase
    .from("user_roles").select("role").eq("user_id", context.userId);
  if (!(roles ?? []).some((r: any) => r.role === "admin")) throw new Error("Forbidden");
}

export const listAdminMedicines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("medicines").select("*").order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);
    return { medicines: data ?? [] };
  });

export const upsertMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: MedicineInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.name?.trim()) throw new Error("Name is required");
    if (typeof data.price_pkr !== "number" || data.price_pkr < 0) throw new Error("Valid price required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name.trim(),
      brand: (data.brand ?? "").trim(),
      category: (data.category ?? "").trim(),
      price_pkr: data.price_pkr,
      old_price_pkr: data.old_price_pkr ?? null,
      stock: data.stock ?? 0,
      image: data.image?.trim() || null,
      description: data.description?.trim() || null,
      prescription_required: !!data.prescription_required,
      rating: data.rating ?? 4.5,
      is_active: data.is_active ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("medicines").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("medicines").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("medicines").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });