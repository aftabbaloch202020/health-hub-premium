import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

function validate(d: ContactInput) {
  const errs: string[] = [];
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (s(d.name).length < 2) errs.push("Name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(d.email))) errs.push("Valid email is required");
  if (s(d.message).length < 5) errs.push("Message is required");
  if (s(d.name).length > 120 || s(d.email).length > 200 || s(d.message).length > 4000) errs.push("Input too long");
  return errs;
}

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: ContactInput) => d)
  .handler(async ({ data }) => {
    const errs = validate(data);
    if (errs.length) throw new Error(errs.join(", "));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listContactMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { messages: data ?? [] };
  });

export const updateContactStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "new" | "read" | "replied" }) => d)
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_messages").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });