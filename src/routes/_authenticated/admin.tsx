import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOrders, updateOrderStatus, claimFirstAdmin, listUsers } from "@/lib/orders.functions";
import { listContactMessages, updateContactStatus } from "@/lib/contact.functions";
import { listAdminMedicines, upsertMedicine, deleteMedicine, type MedicineRow, type MedicineInput } from "@/lib/medicines.functions";
import { adminListPayments, adminGetScreenshotUrl, adminApprovePayment, adminRejectPayment, adminSuspendSubscription, adminUsageStats } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/medicines";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Orders — Darman STORE" }] }),
  component: AdminPage,
});

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string | null;
  items: Array<{ id: string; name: string; brand?: string; image?: string; qty: number; pricePKR: number }>;
  subtotal_pkr: number;
  delivery_pkr: number;
  total_pkr: number;
  status: "pending" | "processing" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  created_at: string;
};

const STATUSES: Order["status"][] = ["pending", "processing", "confirmed", "dispatched", "delivered", "cancelled"];

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-blue-500/15 text-blue-600",
  confirmed: "bg-primary/15 text-primary",
  dispatched: "bg-indigo-500/15 text-indigo-600",
  delivered: "bg-green-500/15 text-green-600",
  cancelled: "bg-destructive/15 text-destructive",
};

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listOrders);
  const update = useServerFn(updateOrderStatus);
  const claim = useServerFn(claimFirstAdmin);
  const usersFn = useServerFn(listUsers);
  const msgsFn = useServerFn(listContactMessages);
  const updateMsg = useServerFn(updateContactStatus);
  const medsFn = useServerFn(listAdminMedicines);
  const medSave = useServerFn(upsertMedicine);
  const medDel = useServerFn(deleteMedicine);
  const payListFn = useServerFn(adminListPayments);
  const paySignFn = useServerFn(adminGetScreenshotUrl);
  const payApproveFn = useServerFn(adminApprovePayment);
  const payRejectFn = useServerFn(adminRejectPayment);
  const subSuspendFn = useServerFn(adminSuspendSubscription);
  const statsFn = useServerFn(adminUsageStats);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");
  const [active, setActive] = useState<Order | null>(null);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [tab, setTab] = useState<"orders" | "users" | "messages" | "medicines" | "payments" | "stats">("orders");
  const [editMed, setEditMed] = useState<Partial<MedicineRow> | null>(null);
  const [payFilter, setPayFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        return await list();
      } catch (e) {
        if ((e as Error).message.includes("Forbidden")) setNeedsClaim(true);
        throw e;
      }
    },
    retry: false,
  });

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersFn(),
    enabled: tab === "users" && !needsClaim,
  });
  const msgsQ = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => msgsFn(),
    enabled: tab === "messages" && !needsClaim,
  });
  const msgMut = useMutation({
    mutationFn: (v: { id: string; status: "new" | "read" | "replied" }) => updateMsg({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-messages"] }); toast.success("Updated"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const medsQ = useQuery({
    queryKey: ["admin-medicines"],
    queryFn: () => medsFn(),
    enabled: tab === "medicines" && !needsClaim,
  });
  const medSaveMut = useMutation({
    mutationFn: (v: MedicineInput) => medSave({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-medicines"] }); toast.success("Saved"); setEditMed(null); },
    onError: (e) => toast.error((e as Error).message),
  });
  const medDelMut = useMutation({
    mutationFn: (id: string) => medDel({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-medicines"] }); toast.success("Deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const paymentsQ = useQuery({
    queryKey: ["admin-payments", payFilter],
    queryFn: () => payListFn(),
    enabled: tab === "payments" && !needsClaim,
  });
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsFn(),
    enabled: tab === "stats" && !needsClaim,
  });
  const approveMut = useMutation({
    mutationFn: (id: string) => payApproveFn({ data: { payment_id: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); toast.success("Approved — subscription activated"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const rejectMut = useMutation({
    mutationFn: (v: { id: string; reason?: string }) => payRejectFn({ data: { payment_id: v.id, reason: v.reason } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); toast.success("Rejected"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const suspendMut = useMutation({
    mutationFn: (sub_id: string) => subSuspendFn({ data: { sub_id, action: "suspend" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payments"] }); toast.success("Subscription suspended"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const viewScreenshot = async (path: string) => {
    try {
      const { url } = await paySignFn({ data: { path } });
      window.open(url, "_blank");
    } catch (e) { toast.error((e as Error).message); }
  };

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: Order["status"] }) => update({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const tryClaim = async () => {
    try {
      const r = await claim();
      if (r.granted) {
        toast.success("Admin access granted");
        setNeedsClaim(false);
        q.refetch();
      } else {
        toast.error("An admin already exists. Ask them to grant you access.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const orders: Order[] = (q.data?.orders ?? []) as unknown as Order[];

  const filtered = useMemo(() => {
    let l = orders;
    if (statusFilter !== "all") l = l.filter((o) => o.status === statusFilter);
    const s = search.trim().toLowerCase();
    if (s) l = l.filter((o) =>
      o.order_number.toLowerCase().includes(s) ||
      o.customer_name.toLowerCase().includes(s) ||
      o.phone.toLowerCase().includes(s) ||
      o.email.toLowerCase().includes(s) ||
      o.city.toLowerCase().includes(s),
    );
    return l;
  }, [orders, statusFilter, search]);

  const stats = useMemo(() => {
    const by: Record<string, number> = { all: orders.length };
    STATUSES.forEach((s) => (by[s] = orders.filter((o) => o.status === s).length));
    return by;
  }, [orders]);

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-cta grid place-items-center"><i className="fa-solid fa-prescription-bottle-medical text-primary-foreground" /></div>
            <span className="font-extrabold">Darman Admin</span>
          </Link>
          <span className="text-sm text-muted-foreground hidden md:inline">· Orders</span>
          <button onClick={signOut} className="ml-auto px-3 py-2 rounded-lg text-sm hover:bg-muted"><i className="fa-solid fa-right-from-bracket mr-2" />Sign out</button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {needsClaim ? (
          <div className="bg-card rounded-3xl p-8 text-center shadow-card max-w-lg mx-auto">
            <i className="fa-solid fa-shield-halved text-5xl text-primary mb-4" />
            <h2 className="text-2xl font-extrabold mb-2">Become the admin</h2>
            <p className="text-muted-foreground mb-6">This account doesn't have admin access yet. If you're the first user, click below to claim it.</p>
            <button onClick={tryClaim} className="px-6 py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-bold shadow-glow">
              <i className="fa-solid fa-key mr-2" />Grant me admin access
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5 border-b">
              {(["orders","medicines","payments","stats","users","messages"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  <i className={`fa-solid ${t === "orders" ? "fa-bag-shopping" : t === "medicines" ? "fa-pills" : t === "users" ? "fa-users" : t === "messages" ? "fa-envelope" : t === "payments" ? "fa-money-check-dollar" : "fa-chart-line"} mr-2`} />{t}
                </button>
              ))}
            </div>

            {tab === "orders" && (<>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">Orders</h1>
                <p className="text-sm text-muted-foreground">{stats.all} total · live from database</p>
              </div>
              <div className="relative w-full md:w-80">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order #, name, phone, email…"
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-card border outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All ({stats.all})</Chip>
              {STATUSES.map((s) => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  <span className="capitalize">{s}</span> ({stats[s] ?? 0})
                </Chip>
              ))}
            </div>

            {q.isLoading ? (
              <div className="text-center py-20"><i className="fa-solid fa-spinner animate-spin text-3xl text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-card rounded-3xl">No orders match.</div>
            ) : (
              <div className="bg-card rounded-3xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3 text-left">Order</th>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">City</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-bold">{o.order_number}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{o.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{o.phone}</div>
                          </td>
                          <td className="px-4 py-3">{o.city}</td>
                          <td className="px-4 py-3 text-right font-bold text-primary">{formatPKR(o.total_pkr)}</td>
                          <td className="px-4 py-3">
                            <select value={o.status}
                              onChange={(e) => mut.mutate({ id: o.id, status: e.target.value as Order["status"] })}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize border-0 outline-none cursor-pointer ${STATUS_COLORS[o.status]}`}>
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setActive(o)} className="px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-xs font-semibold">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>)}

            {tab === "users" && (
              <div className="bg-card rounded-3xl shadow-card overflow-hidden">
                <div className="p-5 border-b"><h2 className="text-xl font-extrabold">Registered users ({(usersQ.data?.users ?? []).length})</h2></div>
                {usersQ.isLoading ? <div className="text-center py-16"><i className="fa-solid fa-spinner animate-spin text-2xl text-primary" /></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60 text-xs uppercase font-bold">
                        <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Phone</th><th className="px-4 py-3 text-left">Joined</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {(usersQ.data?.users ?? []).map((u: any) => (
                          <tr key={u.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 font-semibold">{u.full_name || "—"}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3">{u.phone || "—"}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                        {(usersQ.data?.users ?? []).length === 0 && <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No users yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "messages" && (
              <div className="space-y-3">
                {msgsQ.isLoading ? <div className="text-center py-16"><i className="fa-solid fa-spinner animate-spin text-2xl text-primary" /></div> :
                  (msgsQ.data?.messages ?? []).length === 0 ? <div className="text-center py-20 bg-card rounded-3xl text-muted-foreground">No messages yet.</div> :
                  (msgsQ.data?.messages ?? []).map((m: any) => (
                    <div key={m.id} className="bg-card rounded-2xl shadow-card p-5">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="font-semibold">{m.name}</div>
                        <a href={`mailto:${m.email}`} className="text-sm text-primary">{m.email}</a>
                        {m.phone && <span className="text-sm text-muted-foreground">{m.phone}</span>}
                        <select value={m.status} onChange={(e) => msgMut.mutate({ id: m.id, status: e.target.value as any })}
                          className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-muted capitalize">
                          <option value="new">new</option><option value="read">read</option><option value="replied">replied</option>
                        </select>
                      </div>
                      {m.subject && <div className="text-sm font-semibold mb-1">{m.subject}</div>}
                      <div className="text-sm whitespace-pre-wrap text-muted-foreground">{m.message}</div>
                      <div className="text-xs text-muted-foreground mt-2">{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            )}

            {tab === "medicines" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold">Medicines ({(medsQ.data?.medicines ?? []).length})</h2>
                    <p className="text-sm text-muted-foreground">Add, edit, and manage stock</p>
                  </div>
                  <button onClick={() => setEditMed({ name: "", brand: "", category: "", price_pkr: 0, stock: 0, is_active: true, prescription_required: false, rating: 4.5 })}
                    className="px-4 py-2.5 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-soft">
                    <i className="fa-solid fa-plus mr-2" />Add medicine
                  </button>
                </div>
                {medsQ.isLoading ? <div className="text-center py-16"><i className="fa-solid fa-spinner animate-spin text-2xl text-primary" /></div> : (
                  <div className="bg-card rounded-3xl shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-xs uppercase font-bold">
                          <tr><th className="px-4 py-3 text-left">Medicine</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3"></th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {(medsQ.data?.medicines ?? []).map((m: MedicineRow) => (
                            <tr key={m.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3"><div className="flex items-center gap-3">{m.image && <img src={m.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-background" />}<div><div className="font-semibold">{m.name}</div><div className="text-xs text-muted-foreground">{m.brand}</div></div></div></td>
                              <td className="px-4 py-3">{m.category || "—"}</td>
                              <td className="px-4 py-3 text-right font-bold text-primary">{formatPKR(m.price_pkr)}</td>
                              <td className={`px-4 py-3 text-right font-bold ${m.stock === 0 ? "text-destructive" : m.stock < 10 ? "text-warning" : ""}`}>{m.stock}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${m.is_active ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"}`}>{m.is_active ? "Active" : "Hidden"}</span></td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button onClick={() => setEditMed(m)} className="px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-xs font-semibold"><i className="fa-solid fa-pen mr-1" />Edit</button>
                                <button onClick={() => { if (confirm(`Delete ${m.name}?`)) medDelMut.mutate(m.id); }} className="px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold"><i className="fa-solid fa-trash" /></button>
                              </td>
                            </tr>
                          ))}
                          {(medsQ.data?.medicines ?? []).length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No medicines yet. Click "Add medicine" to create one.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "payments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-2xl font-extrabold">Payments ({(paymentsQ.data ?? []).length})</h2>
                  <div className="flex gap-2">
                    {(["all","pending","approved","rejected"] as const).map(s => (
                      <Chip key={s} active={payFilter === s} onClick={() => setPayFilter(s)}>{s}</Chip>
                    ))}
                  </div>
                </div>
                {paymentsQ.isLoading ? <div className="text-center py-16"><i className="fa-solid fa-spinner animate-spin text-2xl text-primary" /></div> : (
                  <div className="bg-card rounded-3xl shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-xs uppercase font-bold">
                          <tr><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Plan</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">Method</th><th className="px-4 py-3 text-left">Tx ID</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3"></th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {(paymentsQ.data ?? []).filter((p: any) => payFilter === "all" || p.status === payFilter).map((p: any) => (
                            <tr key={p.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3"><div className="font-semibold">{p.full_name}</div><div className="text-xs text-muted-foreground">{p.email}</div></td>
                              <td className="px-4 py-3 capitalize">{p.plan}</td>
                              <td className="px-4 py-3 text-right font-bold text-primary">{formatPKR(p.amount_pkr)}</td>
                              <td className="px-4 py-3 capitalize">{p.method}</td>
                              <td className="px-4 py-3 font-mono text-xs">{p.transaction_id || "—"}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${p.status === "approved" ? "bg-green-500/15 text-green-600" : p.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>{p.status}</span></td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                              <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                                <button onClick={() => viewScreenshot(p.screenshot_url)} className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-accent text-xs font-semibold"><i className="fa-solid fa-image mr-1" />View</button>
                                {p.status === "pending" && (<>
                                  <button onClick={() => approveMut.mutate(p.id)} className="px-2.5 py-1.5 rounded-lg bg-green-500/15 text-green-600 hover:bg-green-500/25 text-xs font-semibold"><i className="fa-solid fa-check mr-1" />Approve</button>
                                  <button onClick={() => { const r = prompt("Reason?") ?? undefined; rejectMut.mutate({ id: p.id, reason: r }); }} className="px-2.5 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold"><i className="fa-solid fa-xmark mr-1" />Reject</button>
                                </>)}
                              </td>
                            </tr>
                          ))}
                          {(paymentsQ.data ?? []).length === 0 && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No payments yet.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "stats" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold">AI usage statistics</h2>
                {statsQ.isLoading ? <div className="text-center py-16"><i className="fa-solid fa-spinner animate-spin text-2xl text-primary" /></div> : (
                  <>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-card rounded-2xl p-5 border"><div className="text-xs text-muted-foreground uppercase font-bold">Total uses</div><div className="text-3xl font-extrabold mt-1">{(statsQ.data?.totalFree ?? 0) + (statsQ.data?.totalPaid ?? 0)}</div></div>
                      <div className="bg-card rounded-2xl p-5 border"><div className="text-xs text-muted-foreground uppercase font-bold">Free trials</div><div className="text-3xl font-extrabold mt-1">{statsQ.data?.totalFree ?? 0}</div></div>
                      <div className="bg-card rounded-2xl p-5 border"><div className="text-xs text-muted-foreground uppercase font-bold">Paid uses</div><div className="text-3xl font-extrabold mt-1">{statsQ.data?.totalPaid ?? 0}</div></div>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border">
                      <div className="font-bold mb-3">Usage by tool</div>
                      <div className="space-y-2">
                        {Object.entries(statsQ.data?.byTool ?? {}).map(([tool, count]) => (
                          <div key={tool} className="flex items-center gap-3 text-sm">
                            <div className="w-32 capitalize font-medium">{tool}</div>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-cta" style={{ width: `${Math.min(100, (Number(count) / Math.max(1, Math.max(...Object.values(statsQ.data?.byTool ?? { x: 1 }).map(Number)))) * 100)}%` }} /></div>
                            <div className="w-10 text-right font-bold">{Number(count)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {active && <OrderModal o={active} onClose={() => setActive(null)} />}
      {editMed && <MedicineModal initial={editMed} onClose={() => setEditMed(null)} onSave={(v) => medSaveMut.mutate(v)} saving={medSaveMut.isPending} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-semibold transition ${active ? "bg-gradient-cta text-primary-foreground shadow-soft" : "bg-card hover:bg-muted"}`}>
      {children}
    </button>
  );
}

function OrderModal({ o, onClose }: { o: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl shadow-elegant w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <div className="font-mono font-bold text-lg">{o.order_number}</div>
            <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted grid place-items-center"><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Customer">{o.customer_name}</Info>
            <Info label="Phone">{o.phone}</Info>
            <Info label="Email">{o.email}</Info>
            <Info label="City">{o.city}</Info>
          </div>
          <Info label="Address">{o.address}</Info>
          {o.notes && <Info label="Notes">{o.notes}</Info>}

          <div className="rounded-2xl border overflow-hidden">
            <div className="px-4 py-2 bg-muted font-bold">Items</div>
            <div className="divide-y">
              {o.items.map((i) => (
                <div key={i.id} className="p-3 flex gap-3 items-center">
                  {i.image && <img src={i.image} alt={i.name} className="w-12 h-12 rounded-lg object-contain bg-background" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.brand} · qty {i.qty} × {formatPKR(i.pricePKR)}</div>
                  </div>
                  <div className="font-bold text-primary">{formatPKR(i.pricePKR * i.qty)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 space-y-1">
            <Row label="Subtotal">{formatPKR(o.subtotal_pkr)}</Row>
            <Row label="Delivery">{o.delivery_pkr === 0 ? "Free" : formatPKR(o.delivery_pkr)}</Row>
            <div className="border-t pt-2 mt-2 flex justify-between font-extrabold text-base"><span>Total</span><span className="text-primary">{formatPKR(o.total_pkr)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{children}</span></div>;
}

function MedicineModal({ initial, onClose, onSave, saving }: { initial: Partial<MedicineRow>; onClose: () => void; onSave: (v: MedicineInput) => void; saving: boolean }) {
  const [v, setV] = useState<Partial<MedicineRow>>(initial);
  const set = (k: keyof MedicineRow, val: any) => setV((p) => ({ ...p, [k]: val }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: v.id,
      name: v.name ?? "",
      brand: v.brand ?? "",
      category: v.category ?? "",
      price_pkr: Number(v.price_pkr ?? 0),
      old_price_pkr: v.old_price_pkr != null ? Number(v.old_price_pkr) : null,
      stock: Number(v.stock ?? 0),
      image: (v.image ?? "") as string,
      description: (v.description ?? "") as string,
      prescription_required: !!v.prescription_required,
      rating: Number(v.rating ?? 4.5),
      is_active: v.is_active ?? true,
    });
  };
  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-card rounded-3xl shadow-elegant w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center">
          <div className="font-bold text-lg">{v.id ? "Edit medicine" : "Add medicine"}</div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted grid place-items-center"><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-sm">
          <Field label="Name *" full><input required value={v.name ?? ""} onChange={(e) => set("name", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Brand"><input value={v.brand ?? ""} onChange={(e) => set("brand", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Category"><input value={v.category ?? ""} onChange={(e) => set("category", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Price (PKR) *"><input required type="number" min={0} step="0.01" value={v.price_pkr ?? 0} onChange={(e) => set("price_pkr", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Old price (PKR)"><input type="number" min={0} step="0.01" value={v.old_price_pkr ?? ""} onChange={(e) => set("old_price_pkr", e.target.value === "" ? null : e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Stock"><input type="number" min={0} value={v.stock ?? 0} onChange={(e) => set("stock", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Rating"><input type="number" min={0} max={5} step="0.1" value={v.rating ?? 4.5} onChange={(e) => set("rating", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Image URL" full><input value={v.image ?? ""} onChange={(e) => set("image", e.target.value)} placeholder="https://..." className="w-full h-10 px-3 rounded-lg bg-muted border outline-none" /></Field>
          <Field label="Description" full><textarea rows={3} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border outline-none" /></Field>
          <label className="flex items-center gap-2 col-span-1"><input type="checkbox" checked={!!v.prescription_required} onChange={(e) => set("prescription_required", e.target.checked)} />Prescription required</label>
          <label className="flex items-center gap-2 col-span-1"><input type="checkbox" checked={v.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} />Active (visible to customers)</label>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-muted font-semibold">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-soft disabled:opacity-60">
            {saving ? <i className="fa-solid fa-spinner animate-spin" /> : <><i className="fa-solid fa-floppy-disk mr-2" />Save</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">{label}</div>
      {children}
    </div>
  );
}