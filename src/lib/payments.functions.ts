import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PLAN_INFO = {
  weekly:  { pkr: 99,  days: 7 },
  monthly: { pkr: 199, days: 30 },
  yearly:  { pkr: 399, days: 365 },
} as const;

const PlanSchema = z.enum(["weekly", "monthly", "yearly"]);
const MethodSchema = z.enum(["easypaisa", "jazzcash"]);

export const submitPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    full_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    plan: PlanSchema,
    method: MethodSchema,
    transaction_id: z.string().trim().max(80).optional().nullable(),
    screenshot_path: z.string().min(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const info = PLAN_INFO[data.plan];
    const { data: inserted, error } = await context.supabase.from("payments").insert({
      user_id: context.userId,
      full_name: data.full_name,
      email: data.email,
      plan: data.plan,
      amount_pkr: info.pkr,
      method: data.method,
      transaction_id: data.transaction_id || null,
      screenshot_url: data.screenshot_path,
      status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("payments").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
    return data ?? [];
  });

export const mySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).order("expires_at", { ascending: false }).limit(1).maybeSingle();
    return data;
  });

/* ---------- Admin ---------- */

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(500);
    return data ?? [];
  });

export const adminGetScreenshotUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: signed, error } = await context.supabase.storage.from("payment-screenshots").createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const adminApprovePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ payment_id: z.string().uuid(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const { data: pay, error } = await supabase.from("payments").select("*").eq("id", data.payment_id).single();
    if (error) throw new Error(error.message);
    if (pay.status === "approved") return { ok: true, already: true };
    const info = { weekly: 7, monthly: 30, yearly: 365 }[pay.plan as "weekly"|"monthly"|"yearly"];
    const now = new Date();
    const expires = new Date(now.getTime() + info * 24 * 60 * 60 * 1000);

    // suspend other active subs
    await supabase.from("subscriptions").update({ status: "expired" }).eq("user_id", pay.user_id).eq("status", "active");

    const { error: subErr } = await supabase.from("subscriptions").insert({
      user_id: pay.user_id, plan: pay.plan, status: "active",
      starts_at: now.toISOString(), expires_at: expires.toISOString(),
      payment_id: pay.id, activated_by: userId,
    });
    if (subErr) throw new Error(subErr.message);
    await supabase.from("payments").update({ status: "approved", reviewed_by: userId, reviewed_at: now.toISOString(), admin_note: data.note ?? null }).eq("id", pay.id);
    return { ok: true };
  });

export const adminRejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ payment_id: z.string().uuid(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("payments").update({ status: "rejected", reviewed_by: context.userId, reviewed_at: new Date().toISOString(), admin_note: data.note ?? "Rejected" }).eq("id", data.payment_id);
    return { ok: true };
  });

export const adminSuspendSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sub_id: z.string().uuid(), action: z.enum(["suspend", "reactivate"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const newStatus = data.action === "suspend" ? "suspended" : "active";
    await context.supabase.from("subscriptions").update({ status: newStatus }).eq("id", data.sub_id);
    return { ok: true };
  });

export const adminUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: usage } = await context.supabase.from("ai_usage").select("tool,used_at,was_free").order("used_at", { ascending: false }).limit(500);
    const byTool: Record<string, number> = {};
    (usage ?? []).forEach((r: any) => { byTool[r.tool] = (byTool[r.tool] ?? 0) + 1; });
    const totalFree = (usage ?? []).filter((r: any) => r.was_free).length;
    const totalPaid = (usage ?? []).filter((r: any) => !r.was_free).length;
    return { byTool, totalFree, totalPaid, recent: (usage ?? []).slice(0, 50) };
  });