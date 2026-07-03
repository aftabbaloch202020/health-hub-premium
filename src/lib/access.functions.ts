import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const AI_TOOLS = ["prescription", "report", "skin", "voice", "health", "chat"] as const;
export type AiTool = typeof AI_TOOLS[number];

export type AccessInfo = {
  loggedIn: boolean;
  isAdmin: boolean;
  hasActiveSub: boolean;
  subExpiresAt: string | null;
  subPlan: string | null;
  usageByTool: Record<string, number>;
};

export const getAccessInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessInfo> => {
    const { supabase, userId } = context;
    const [{ data: sub }, { data: usage }, { data: adminRow }] = await Promise.all([
      supabase.from("subscriptions").select("plan,expires_at,status").eq("user_id", userId).eq("status", "active").gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ai_usage").select("tool").eq("user_id", userId),
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    ]);
    const usageByTool: Record<string, number> = {};
    (usage ?? []).forEach((r: { tool: string }) => { usageByTool[r.tool] = (usageByTool[r.tool] ?? 0) + 1; });
    return {
      loggedIn: true,
      isAdmin: !!adminRow,
      hasActiveSub: !!sub,
      subExpiresAt: sub?.expires_at ?? null,
      subPlan: sub?.plan ?? null,
      usageByTool,
    };
  });

export const consumeAiUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tool: z.enum(AI_TOOLS) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // admin bypass
    const { data: adminRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (adminRow) return { ok: true, wasFree: false };
    // active subscription?
    const { data: sub } = await supabase.from("subscriptions").select("id").eq("user_id", userId).eq("status", "active").gt("expires_at", new Date().toISOString()).maybeSingle();
    if (sub) {
      await supabase.from("ai_usage").insert({ user_id: userId, tool: data.tool, was_free: false });
      return { ok: true, wasFree: false };
    }
    // free trial: 1 per tool
    const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tool", data.tool);
    if ((count ?? 0) >= 1) {
      throw new Error("Your free trial for this tool is used. Please subscribe to continue.");
    }
    await supabase.from("ai_usage").insert({ user_id: userId, tool: data.tool, was_free: true });
    return { ok: true, wasFree: true };
  });

export const listMyAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("ai_usage").select("id,tool,used_at,was_free").eq("user_id", context.userId).order("used_at", { ascending: false }).limit(100);
    return data ?? [];
  });