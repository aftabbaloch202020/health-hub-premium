import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccessInfo, listMyAiUsage } from "@/lib/access.functions";
import { listMyPayments, mySubscription } from "@/lib/payments.functions";
import { TOOL_LABELS } from "@/components/medicare/AiGate";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Darman STORE" }] }),
  component: DashboardPage,
});

function daysLeft(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { const u = data.user; if (u) setUser({ email: u.email ?? "", name: (u.user_metadata?.full_name as string) ?? u.email?.split("@")[0] ?? "" }); }); }, []);

  const accessFn = useServerFn(getAccessInfo);
  const paymentsFn = useServerFn(listMyPayments);
  const subFn = useServerFn(mySubscription);
  const usageFn = useServerFn(listMyAiUsage);

  const access = useQuery({ queryKey: ["dash-access"], queryFn: () => accessFn() });
  const sub = useQuery({ queryKey: ["dash-sub"], queryFn: () => subFn() });
  const payments = useQuery({ queryKey: ["dash-payments"], queryFn: () => paymentsFn() });
  const usage = useQuery({ queryKey: ["dash-usage"], queryFn: () => usageFn() });

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  const dLeft = daysLeft(sub.data?.expires_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary"><i className="fa-solid fa-arrow-left mr-2" />Home</Link>
            <h1 className="text-3xl font-extrabold mt-1">My Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/subscribe" className="px-4 py-2 rounded-xl bg-gradient-cta text-primary-foreground font-semibold shadow-glow text-sm">
              <i className="fa-solid fa-crown mr-2" />Subscribe / Renew
            </Link>
            <button onClick={signOut} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm">
              <i className="fa-solid fa-arrow-right-from-bracket mr-2" />Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card icon="fa-user" title="Profile">
            <div className="font-semibold">{user?.name || "—"}</div>
            <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
            {access.data?.isAdmin && <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">ADMIN</span>}
          </Card>
          <Card icon="fa-crown" title="Subscription">
            {sub.data && sub.data.status === "active" && dLeft && dLeft > 0 ? (
              <>
                <div className="font-semibold capitalize">{sub.data.plan} plan</div>
                <div className="text-sm text-muted-foreground">Active · {dLeft} day{dLeft === 1 ? "" : "s"} left</div>
                <div className="text-xs text-muted-foreground">Expires {new Date(sub.data.expires_at).toLocaleDateString()}</div>
              </>
            ) : (
              <>
                <div className="font-semibold text-muted-foreground">No active subscription</div>
                <div className="text-sm text-muted-foreground">Using 1 free trial per AI tool.</div>
              </>
            )}
          </Card>
          <Card icon="fa-clock-rotate-left" title="Latest payment">
            {payments.data && payments.data.length > 0 ? (
              <>
                <div className="font-semibold capitalize">{payments.data[0].plan} · PKR {payments.data[0].amount_pkr}</div>
                <StatusPill status={payments.data[0].status} />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No payments yet</div>
            )}
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Panel title="Payment history">
            {(payments.data?.length ?? 0) === 0 ? <Empty text="No payments submitted yet." /> : (
              <div className="divide-y divide-border">
                {payments.data!.map(p => (
                  <div key={p.id} className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted grid place-items-center"><i className="fa-solid fa-receipt" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold capitalize text-sm">{p.plan} · PKR {p.amount_pkr}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()} · {p.method}</div>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="AI usage history">
            {(usage.data?.length ?? 0) === 0 ? <Empty text="You haven't used any AI tools yet." /> : (
              <div className="divide-y divide-border max-h-[420px] overflow-auto">
                {usage.data!.map(u => (
                  <div key={u.id} className="py-2 flex items-center gap-3 text-sm">
                    <i className="fa-solid fa-wand-magic-sparkles text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{TOOL_LABELS[u.tool as keyof typeof TOOL_LABELS] ?? u.tool}</div>
                      <div className="text-xs text-muted-foreground">{new Date(u.used_at).toLocaleString()}</div>
                    </div>
                    {u.was_free && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning font-semibold">FREE</span>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><i className={`fa-solid ${icon}`} />{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-2">{title}</h3>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) { return <div className="py-8 text-center text-sm text-muted-foreground">{text}</div>; }
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/20 text-warning",
    approved: "bg-green-500/20 text-green-600",
    rejected: "bg-destructive/20 text-destructive",
    active: "bg-green-500/20 text-green-600",
    expired: "bg-muted text-muted-foreground",
    suspended: "bg-destructive/20 text-destructive",
  };
  return <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${map[status] ?? "bg-muted"}`}>{status}</span>;
}