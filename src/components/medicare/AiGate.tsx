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
    return <LockedShell title={title ?? TOOL_LABELS[tool]} icon="fa-lock" heading="Sign in required" text="Create a free account to try any AI tool. Every new user gets 1 free use per tool.">
      <Link to="/auth" className="btn-primary">Sign in / Register</Link>
      {children}
    </LockedShell>;
  }

  if (isLoading || !access) {
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground"><i className="fa-solid fa-spinner animate-spin mr-2" />Checking access…</div>;
  }

  const used = (access.usageByTool[tool] ?? 0) > 0;
  const canUse = access.isAdmin || access.hasActiveSub || !used || unlocked;

  if (canUse) return <>{children}</>;

  if (used && !access.hasActiveSub) {
    return <LockedShell title={title ?? TOOL_LABELS[tool]} icon="fa-crown" heading="Subscribe to continue" text="You've used your 1 free trial for this tool. Choose a plan to unlock unlimited access.">
      <Link to="/subscribe" className="btn-primary">View plans</Link>
      {children}
    </LockedShell>;
  }

  return <LockedShell title={title ?? TOOL_LABELS[tool]} icon="fa-gift" heading="You have 1 free use" text="Click below to unlock this tool. Free trial is one use per tool — after that you'll need a subscription.">
    <button onClick={() => consume.mutate()} disabled={consume.isPending} className="btn-primary">
      {consume.isPending ? <><i className="fa-solid fa-spinner animate-spin mr-2" />Unlocking…</> : <><i className="fa-solid fa-unlock mr-2" />Use my free trial</>}
    </button>
    {children}
  </LockedShell>;
}

function LockedShell({ title, icon, heading, text, children }: { title: string; icon: string; heading: string; text: string; children: React.ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="relative rounded-3xl overflow-hidden border border-border shadow-elegant bg-card">
        <div className="relative">
          <div className="pointer-events-none select-none blur-md opacity-40 max-h-[420px] overflow-hidden">
            {children}
          </div>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm grid place-items-center">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-cta grid place-items-center shadow-glow mb-4">
                <i className={`fa-solid ${icon} text-2xl text-primary-foreground`} />
              </div>
              <div className="text-xs uppercase tracking-widest text-primary font-bold mb-1">{title}</div>
              <h3 className="text-2xl font-extrabold mb-2">{heading}</h3>
              <p className="text-sm text-muted-foreground mb-5">{text}</p>
              <div className="flex justify-center gap-2 [&_.btn-primary]:px-6 [&_.btn-primary]:py-3 [&_.btn-primary]:rounded-xl [&_.btn-primary]:bg-gradient-cta [&_.btn-primary]:text-primary-foreground [&_.btn-primary]:font-semibold [&_.btn-primary]:shadow-glow">
                {/* The button/link passed as children is the first child before the section content */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}