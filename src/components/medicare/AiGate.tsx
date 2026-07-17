import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAccessInfo, consumeAiUsage, type AiTool } from "@/lib/access.functions";
import { toast } from "sonner";

export const TOOL_LABELS: Record<AiTool, string> = {
  prescription: "AI Prescription Scanner",
  report: "AI Report Analysis",
  skin: "AI Skin Analysis",
  voice: "AI Voice Assistant",
  health: "AI Health Dashboard",
  reminder: "AI Medicine Reminder",
  chat: "AI Pharmacist Chat",
};

function useSession() {
  const { data } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  return data;
}

export default function AiGate({ tool, title, children }: { tool: AiTool; title?: string; children: React.ReactNode }) {
  const session = useSession();
  const qc = useQueryClient();
  const accessFn = useServerFn(getAccessInfo);
  const consumeFn = useServerFn(consumeAiUsage);
  const [unlocked, setUnlocked] = useState(false);

  const { data: access, isLoading } = useQuery({
    queryKey: ["ai-access", session?.user?.id ?? "anon"],
    queryFn: () => accessFn(),
    enabled: !!session,
  });

  const consume = useMutation({
    mutationFn: () => consumeFn({ data: { tool } }),
    onSuccess: () => { setUnlocked(true); qc.invalidateQueries({ queryKey: ["ai-access"] }); toast.success("Unlocked — enjoy your AI session"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Not logged in
  if (!session) {
    return <LockedShell title={title ?? TOOL_LABELS[tool]} icon="fa-lock" heading="Sign in required" text="Create a free account to try any AI tool. Every new user gets exactly 1 free AI use."
      cta={<Link to="/auth" search={{ redirect: "/ai-features" }} className="cta-btn">Sign in / Register</Link>} preview={children} />;
  }

  if (isLoading || !access) {
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground"><i className="fa-solid fa-spinner animate-spin mr-2" />Checking access…</div>;
  }

  const canUse = access.isAdmin || access.hasActiveSub || unlocked;
  if (canUse) return <>{children}</>;

  if (!access.freeTrialUsed) {
    return <LockedShell title={title ?? TOOL_LABELS[tool]} icon="fa-gift" heading="Start your 1 free AI use"
      text="Every account gets 1 free AI feature usage. Click to unlock this tool now — after that you'll need a subscription."
      cta={<button onClick={() => consume.mutate()} disabled={consume.isPending} className="cta-btn">
        {consume.isPending ? <><i className="fa-solid fa-spinner animate-spin mr-2" />Unlocking…</> : <><i className="fa-solid fa-unlock mr-2" />Use my free trial</>}
      </button>} preview={children} />;
  }

  return <LockedShell title={title ?? TOOL_LABELS[tool]} icon="fa-crown" heading="Your free trial has ended"
    text="Please choose a subscription plan to continue using AI features."
    cta={<Link to="/subscribe" className="cta-btn">View plans</Link>} preview={children} />;
}

function LockedShell({ title, icon, heading, text, cta, preview }: { title: string; icon: string; heading: string; text: string; cta: React.ReactNode; preview: React.ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="relative rounded-3xl overflow-hidden border border-border shadow-elegant bg-card">
        <div className="relative">
          <div className="pointer-events-none select-none blur-md opacity-40 max-h-[420px] overflow-hidden">
            {preview}
          </div>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm grid place-items-center">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-cta grid place-items-center shadow-glow mb-4">
                <i className={`fa-solid ${icon} text-2xl text-primary-foreground`} />
              </div>
              <div className="text-xs uppercase tracking-widest text-primary font-bold mb-1">{title}</div>
              <h3 className="text-2xl font-extrabold mb-2">{heading}</h3>
              <p className="text-sm text-muted-foreground mb-5">{text}</p>
              <div className="flex justify-center gap-2 [&_.cta-btn]:inline-flex [&_.cta-btn]:items-center [&_.cta-btn]:px-6 [&_.cta-btn]:py-3 [&_.cta-btn]:rounded-xl [&_.cta-btn]:bg-gradient-cta [&_.cta-btn]:text-primary-foreground [&_.cta-btn]:font-semibold [&_.cta-btn]:shadow-glow [&_.cta-btn:disabled]:opacity-60">
                {cta}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}