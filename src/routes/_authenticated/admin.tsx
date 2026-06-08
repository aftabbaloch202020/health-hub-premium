import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOrders, updateOrderStatus, claimFirstAdmin } from "@/lib/orders.functions";
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
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  created_at: string;
};

const STATUSES: Order["status"][] = ["pending", "confirmed", "dispatched", "delivered", "cancelled"];

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-primary/15 text-primary",
  dispatched: "bg-blue-500/15 text-blue-600",
  delivered: "bg-green-500/15 text-green-600",
  cancelled: "bg-destructive/15 text-destructive",
};

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listOrders);
  const update = useServerFn(updateOrderStatus);
  const claim = useServerFn(claimFirstAdmin);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");
  const [active, setActive] = useState<Order | null>(null);
  const [needsClaim, setNeedsClaim] = useState(false);

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
          </>
        )}
      </main>

      {active && <OrderModal o={active} onClose={() => setActive(null)} />}
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