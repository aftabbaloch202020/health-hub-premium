import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExternalMedicines, triggerSync, type ExternalMedicine } from "@/lib/externalMedicines.functions";
import { useCart } from "@/lib/cart";

const PAGE_SIZE = 24;
const fmtPKR = (v: number | null) => (v == null ? "—" : `Rs ${Number(v).toLocaleString("en-PK")}`);

export default function LiveMedicineGrid() {
  const listFn = useServerFn(listExternalMedicines);
  const syncFn = useServerFn(triggerSync);
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["external-medicines"],
    queryFn: () => listFn(),
    staleTime: 5 * 60 * 1000,
  });

  const medicines = data?.medicines ?? [];
  const lastSyncAt = data?.lastSyncAt ?? null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return medicines;
    return medicines.filter((m) => m.name.toLowerCase().includes(term));
  }, [medicines, q]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFn();
      await refetch();
    } finally {
      setSyncing(false);
    }
  };

  const lastSyncLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString("en-PK", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
    : "never";

  return (
    <section id="products" className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Catalog</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-1">Medicines (Live Data)</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isLoading
              ? "Loading live medicines…"
              : `${filtered.length} medicines · synced from timemedico.com.pk · last updated ${lastSyncLabel}`}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search medicines…"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border shadow-card outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Refresh from source"
            className="h-12 px-4 rounded-2xl bg-muted hover:bg-accent text-sm font-semibold disabled:opacity-50"
          >
            <i className={`fa-solid fa-arrows-rotate ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline ml-2">{syncing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-3xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/50">
          <i className="fa-solid fa-pills text-5xl text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">No medicines available yet</h3>
          <p className="text-muted-foreground mb-4">
            {medicines.length === 0
              ? "Click Refresh to pull the latest catalog from timemedico.com.pk."
              : "No medicines match your search."}
          </p>
          {medicines.length === 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-2.5 rounded-2xl bg-gradient-cta text-primary-foreground font-semibold shadow-soft disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.slice(0, visible).map((m) => (
              <LiveCard key={m.id} m={m} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-8 py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-semibold shadow-soft hover:scale-105 transition-smooth"
              >
                Load more ({filtered.length - visible} left)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function LiveCard({ m }: { m: ExternalMedicine }) {
  const { add } = useCart();
  const inStock = m.availability === "in_stock";
  const handleAdd = () => {
    if (!inStock || m.price_pkr == null) return;
    add({
      id: m.id,
      name: m.name,
      brand: "TimeMedico",
      category: "Live",
      price: Number(m.price_pkr) / 280,
      rating: 4.5,
      reviews: 0,
      image: m.image_url || "",
      inStock: true,
    });
  };

  return (
    <div className="group bg-card rounded-3xl overflow-hidden shadow-card hover-lift transition-smooth flex flex-col">
      <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-muted/40 block">
        {m.image_url ? (
          <img
            src={m.image_url}
            alt={m.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 transition-smooth group-hover:scale-105"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <i className="fa-solid fa-pills text-4xl" />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/70 grid place-items-center font-bold text-destructive">
            Out of Stock
          </div>
        )}
      </a>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{m.name}</h3>
        <div className="flex items-end justify-between pt-1 mt-auto">
          <div className="text-base font-extrabold text-primary">{fmtPKR(m.price_pkr)}</div>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              inStock
                ? "bg-primary/10 text-primary"
                : m.availability === "out_of_stock"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {inStock ? "In Stock" : m.availability === "out_of_stock" ? "Out of Stock" : "Check site"}
          </span>
        </div>
        <button
          onClick={handleAdd}
          disabled={!inStock || m.price_pkr == null}
          className="mt-2 py-2 rounded-xl text-xs font-semibold bg-gradient-cta text-primary-foreground shadow-soft hover:scale-105 transition-smooth disabled:opacity-40"
        >
          <i className="fa-solid fa-cart-plus mr-1" /> Add to Cart
        </button>
      </div>
    </div>
  );
}