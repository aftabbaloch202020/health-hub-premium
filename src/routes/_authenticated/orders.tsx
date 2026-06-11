import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/medicines";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — Darman STORE" }] }),
  component: MyOrdersPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-blue-500/15 text-blue-600",
  confirmed: "bg-primary/15 text-primary",
  dispatched: "bg-indigo-500/15 text-indigo-600",
  delivered: "bg-green-500/15 text-green-600",
  cancelled: "bg-destructive/15 text-destructive",
};

function MyOrdersPage() {
  const navigate = useNavigate();
  const fetchOrders = useServerFn(listMyOrders);
  const q = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const orders = (q.data?.orders ?? []) as any[];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-cta grid place-items-center"><i className="fa-solid fa-prescription-bottle-medical text-primary-foreground" /></div>
            <span className="font-extrabold">Darman STORE</span>
          </Link>
          <span className="text-sm text-muted-foreground hidden md:inline">· My Orders</span>
          <button onClick={signOut} className="ml-auto px-3 py-2 rounded-lg text-sm hover:bg-muted"><i className="fa-solid fa-right-from-bracket mr-2" />Sign out</button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">My order history</h1>
            <p className="text-sm text-muted-foreground">All orders linked to your account</p>
          </div>
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">Continue shopping →</Link>
        </div>

        {q.isLoading ? (
          <div className="text-center py-20"><i className="fa-solid fa-spinner animate-spin text-3xl text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl">
            <i className="fa-solid fa-box-open text-5xl text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No orders yet.</p>
            <Link to="/" className="inline-block mt-4 px-6 py-2.5 rounded-full bg-gradient-cta text-primary-foreground font-semibold">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-card rounded-2xl shadow-card p-5">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="font-mono font-bold">{o.order_number}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>{o.status}</span>
                  <div className="ml-auto text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div><div className="text-muted-foreground text-xs uppercase">Delivery to</div>{o.customer_name}, {o.city}</div>
                  <div><div className="text-muted-foreground text-xs uppercase">Items</div>{(o.items as any[]).reduce((s, i) => s + i.qty, 0)} items</div>
                  <div><div className="text-muted-foreground text-xs uppercase">Total</div><span className="font-bold text-primary">{formatPKR(o.total_pkr)}</span></div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">View items</summary>
                  <div className="mt-2 divide-y border rounded-xl">
                    {(o.items as any[]).map((i, idx) => (
                      <div key={idx} className="p-3 flex items-center gap-3 text-sm">
                        {i.image && <img src={i.image} alt={i.name} className="w-10 h-10 rounded-lg object-contain bg-background" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{i.name}</div>
                          <div className="text-xs text-muted-foreground">qty {i.qty} × {formatPKR(i.pricePKR)}</div>
                        </div>
                        <div className="font-bold text-primary">{formatPKR(i.pricePKR * i.qty)}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}