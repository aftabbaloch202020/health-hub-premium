import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OrderItemPayload = {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  qty: number;
  pricePKR: number;
};

export type PlaceOrderInput = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
  items: OrderItemPayload[];
  subtotal_pkr: number;
  delivery_pkr: number;
  total_pkr: number;
};

function genOrderNumber() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(1000 + Math.random() * 9000);
  return `DRM-${y}${m}${day}-${r}`;
}

function validate(input: PlaceOrderInput) {
  const errors: string[] = [];
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (s(input.customer_name).length < 2) errors.push("Name is required");
  if (!/^[+\d][\d\s\-()]{6,20}$/.test(s(input.phone))) errors.push("Valid phone is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(input.email))) errors.push("Valid email is required");
  if (s(input.address).length < 5) errors.push("Delivery address is required");
  if (s(input.city).length < 2) errors.push("City is required");
  if (!Array.isArray(input.items) || input.items.length === 0) errors.push("Cart is empty");
  if (input.total_pkr <= 0) errors.push("Invalid total");
  return errors;
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: PlaceOrderInput) => data)
  .handler(async ({ data }) => {
    const errors = validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const order_number = genOrderNumber();

    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        customer_name: data.customer_name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        address: data.address.trim(),
        city: data.city.trim(),
        notes: data.notes?.trim() || null,
        items: data.items,
        subtotal_pkr: data.subtotal_pkr,
        delivery_pkr: data.delivery_pkr,
        total_pkr: data.total_pkr,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Best-effort email notification (won't fail the order if email is not yet configured)
    try {
      const { sendOrderEmail } = await import("./orders.server");
      await sendOrderEmail(row as any);
    } catch (e) {
      console.warn("[orders] email send skipped:", (e as Error).message);
    }

    return { order_number: row.order_number, id: row.id };
  });

// Authenticated variant — attaches the order to the signed-in user so it
// appears in their order history.
export const placeOrderAuthed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: PlaceOrderInput) => data)
  .handler(async ({ data, context }) => {
    const errors = validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const order_number = genOrderNumber();

    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        user_id: context.userId,
        customer_name: data.customer_name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        address: data.address.trim(),
        city: data.city.trim(),
        notes: data.notes?.trim() || null,
        items: data.items,
        subtotal_pkr: data.subtotal_pkr,
        delivery_pkr: data.delivery_pkr,
        total_pkr: data.total_pkr,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    try {
      const { sendOrderEmail } = await import("./orders.server");
      await sendOrderEmail(row as any);
    } catch (e) {
      console.warn("[orders] email send skipped:", (e as Error).message);
    }

    return { order_number: row.order_number, id: row.id };
  });

// Current user's order history
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

// Admin: list all users (profiles)
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { users: data ?? [] };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { orders: data, isAdmin: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled" }) => d)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      const { data } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return { granted: !!data, alreadyHasAdmin: true };
    }
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { granted: true, alreadyHasAdmin: false };
  });