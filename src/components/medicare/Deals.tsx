import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import dealImg from "@/assets/deal-vitamins.png";

const DEAL = {
  id: "deal-vit-bundle",
  name: "Premium Vitamin Bundle",
  brand: "NutraVita",
  category: "Vitamins & Supplements",
  price: 39.99,
  oldPrice: 79.99,
  rating: 4.9,
  reviews: 1284,
  image: dealImg,
  inStock: true,
};

const DURATION = 44 * 60 * 60 * 1000; // 44 hours
const INITIAL_TARGET = 44 * 60 * 60 * 1000;

function useCountdown(target: number) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, now ? target - now : INITIAL_TARGET);
  const expired = diff === 0;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s, expired };
}

export default function Deals() {
  const targetRef = useRef(0);
  if (!targetRef.current && typeof window !== "undefined") targetRef.current = Date.now() + DURATION;
  const { d, h, m, s, expired } = useCountdown(targetRef.current);
  const { add, count } = useCart();

  const [openProduct, setOpenProduct] = useState(false);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [bounce, setBounce] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // scroll reveal
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setRevealed(true), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setBounce(true);
    setTimeout(() => setBounce(false), 700);
    setTimeout(() => setToast(null), 2400);
  };

  const handleAddToCart = () => {
    add(DEAL as never, qty);
    showToast(`Added ${qty} × ${DEAL.name} to cart`);
  };

  const handleShopClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    }, 700);
  };

  const TimeBox = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center min-w-[68px] px-3 py-2">
      <div className="flex items-center justify-center mb-1.5">
        <i className={`fa-regular ${l === "Days" ? "fa-calendar" : "fa-clock"} text-emerald-500`} />
      </div>
      <div key={v} className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums animate-[scale-in_.3s_ease-out]">
        {String(v).padStart(2, "0")}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{l}</div>
    </div>
  );

  return (
    <section
      id="deals"
      ref={sectionRef}
      className={`container mx-auto px-4 py-12 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div
        className="relative rounded-[2rem] overflow-hidden p-6 md:p-12 shadow-elegant"
        style={{
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #f0f9ff 100%)",
        }}
      >
        {/* abstract circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-10 left-1/2 w-40 h-40 rounded-full bg-emerald-200/40 blur-2xl" />

        <div className="relative grid md:grid-cols-2 gap-10 items-center">
          {/* LEFT */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase text-emerald-700 bg-white/70 backdrop-blur-md border border-emerald-200 shadow-sm">
              <i className="fa-solid fa-bolt text-emerald-500" />
              Limited Time Offer
            </span>

            <h2 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
              Up to <span className="text-emerald-500">50% Off</span>
              <br />
              Premium Vitamins
            </h2>

            <div className="h-1 w-20 rounded-full bg-emerald-500" />

            <p className="text-slate-600 max-w-md text-base md:text-lg leading-relaxed">
              Limited stock — restock by trusted brands at the lowest prices of the season. Genuine, lab-tested supplements delivered fast.
            </p>

            {/* countdown */}
            {expired ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-bold">
                <i className="fa-solid fa-circle-exclamation" /> Deal Expired
              </div>
            ) : (
              <div className="inline-flex items-stretch gap-1 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white p-2 divide-x divide-slate-200">
                <TimeBox v={d} l="Days" />
                <TimeBox v={h} l="Hours" />
                <TimeBox v={m} l="Minutes" />
                <TimeBox v={s} l="Seconds" />
              </div>
            )}

            {/* button */}
            <div className="pt-2">
              <button
                onClick={handleShopClick}
                disabled={loading || expired}
                className="group relative overflow-hidden inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-white shadow-[0_15px_40px_-12px_rgba(16,185,129,0.7)] hover:shadow-[0_20px_50px_-10px_rgba(16,185,129,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                {ripples.map((r) => (
                  <span
                    key={r.id}
                    className="absolute rounded-full bg-white/40 animate-[scale-in_.6s_ease-out]"
                    style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }}
                  />
                ))}
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Loading…
                  </>
                ) : (
                  <>
                    Shop the Deal
                    <i className="fa-solid fa-arrow-right transition-transform duration-300 group-hover:translate-x-1.5" />
                  </>
                )}
              </button>
            </div>

            {/* trust row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><i className="fa-solid fa-truck-fast text-emerald-500" /> Free delivery</span>
              <span className="flex items-center gap-1.5"><i className="fa-solid fa-shield-halved text-emerald-500" /> Verified products</span>
              <span className="flex items-center gap-1.5"><i className="fa-solid fa-rotate-left text-emerald-500" /> Easy returns</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="absolute inset-6 bg-white/40 rounded-[2rem] blur-2xl" />
            <button
              onClick={() => setOpenProduct(true)}
              className="relative block w-full rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-xl border border-white shadow-2xl group cursor-pointer"
              aria-label="View product"
            >
              <img
                src={dealImg}
                alt="Premium vitamin bundle"
                className="w-full h-auto object-contain animate-float transition-transform duration-700 group-hover:scale-110"
              />
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold text-emerald-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-magnifying-glass-plus" /> Quick view
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {openProduct && (
        <Modal onClose={() => setOpenProduct(false)}>
          <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
            <div className="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-2xl p-4 grid place-items-center">
              <img src={dealImg} alt={DEAL.name} className="w-full max-w-xs object-contain animate-float" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">{DEAL.brand}</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{DEAL.name}</h3>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-amber-500"><i className="fa-solid fa-star" /> {DEAL.rating}</span>
                <span className="text-slate-500">({DEAL.reviews} reviews)</span>
              </div>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Multivitamin, Omega-3, Vitamin D3 & C bundle. Trusted brands, lab-tested formulas to power your daily wellness routine.
              </p>
              <div className="flex items-end gap-3 mt-4">
                <span className="text-3xl font-extrabold text-emerald-600">${DEAL.price}</span>
                <span className="text-slate-400 line-through text-lg">${DEAL.oldPrice}</span>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">-50%</span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Quantity</span>
                <div className="inline-flex items-center rounded-full border border-slate-200 overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 hover:bg-slate-100"><i className="fa-solid fa-minus text-xs" /></button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 hover:bg-slate-100"><i className="fa-solid fa-plus text-xs" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleAddToCart}
                  className="px-5 py-3 rounded-full font-semibold border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-all hover:scale-[1.02]"
                >
                  <i className="fa-solid fa-cart-plus mr-2" /> Add to Cart
                </button>
                <button
                  onClick={() => { setOpenProduct(false); setOpenCheckout(true); }}
                  className="px-5 py-3 rounded-full font-semibold text-white shadow-lg hover:scale-[1.02] transition-all"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                >
                  <i className="fa-solid fa-bolt mr-2" /> Buy Now
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CHECKOUT MODAL */}
      {openCheckout && (
        <Modal onClose={() => setOpenCheckout(false)}>
          <div className="p-6 md:p-8 max-w-lg">
            <h3 className="text-2xl font-extrabold text-slate-900">Quick Checkout</h3>
            <p className="text-sm text-slate-500 mt-1">Confirm your order — pay on delivery available.</p>

            <div className="mt-5 flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
              <img src={dealImg} alt="" className="w-16 h-16 object-contain bg-white rounded-xl" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{DEAL.name}</div>
                <div className="text-xs text-slate-500">Qty {qty}</div>
              </div>
              <div className="font-extrabold text-emerald-600">${(DEAL.price * qty).toFixed(2)}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-5">
              <input className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-400" placeholder="Full name" />
              <input className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-400" placeholder="Phone number" />
              <input className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-400" placeholder="Delivery address" />
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-2xl font-extrabold text-slate-900">${(DEAL.price * qty).toFixed(2)}</div>
              </div>
              <button
                onClick={() => { setOpenCheckout(false); showToast("Order placed successfully!"); }}
                className="px-6 py-3 rounded-full font-semibold text-white shadow-lg hover:scale-[1.02] transition-all"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              >
                Place Order <i className="fa-solid fa-check ml-2" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-[fade-in_.3s_ease-out]">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white shadow-2xl">
            <span className={`w-7 h-7 grid place-items-center rounded-full bg-emerald-500 ${bounce ? "animate-[scale-in_.5s_ease-out]" : ""}`}>
              <i className="fa-solid fa-check text-xs" />
            </span>
            <span className="text-sm font-medium">{toast}</span>
            {count > 0 && <span className="text-xs text-slate-300">Cart: {count}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4 animate-[fade-in_.25s_ease-out]" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-[scale-in_.3s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 grid place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <i className="fa-solid fa-xmark" />
        </button>
        {children}
      </div>
    </div>
  );
}
