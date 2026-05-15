import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recognizeMedicine } from "@/lib/recognize.functions";
import { products, type Product } from "@/data/products";
import { useCart } from "@/lib/cart";

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[a.length];
}

function matchProducts(names: string[]): Product[] {
  if (!names.length) return [];
  const tokens = names
    .flatMap((n) => n.toLowerCase().split(/\s+/))
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 3);
  if (!tokens.length) return [];
  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    const haystack = `${p.name} ${p.brand}`.toLowerCase();
    const words = haystack.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, "")).filter(Boolean);
    let best = 0;
    for (const t of tokens) {
      if (haystack.includes(t)) { best = Math.max(best, 1); continue; }
      for (const w of words) {
        if (Math.abs(w.length - t.length) > 2) continue;
        const d = levenshtein(t, w);
        const sim = 1 - d / Math.max(t.length, w.length);
        if (sim >= 0.75) best = Math.max(best, sim * 0.9);
      }
    }
    if (best > 0) scored.push({ p, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const { p } of scored) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= 12) break;
  }
  return out;
}

const fileToDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });

const POPPINS = "'Poppins', system-ui, sans-serif";

export default function PrescriptionCTA() {
  const fileRef = useRef<HTMLInputElement>(null);
  const recognize = useServerFn(recognizeMedicine);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [matches, setMatches] = useState<Product[] | null>(null);
  const [detected, setDetected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // suggestions when no match
  const suggestions = useState(() => {
    const popular = products.filter((p) => p.badge === "Best Seller" || p.badge === "Hot");
    return popular.slice(0, 4);
  })[0];

  useEffect(() => {
    if (!loading) return;
    setProgress(8);
    const id = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 10 : p));
    }, 280);
    return () => clearInterval(id);
  }, [loading]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, HEIC).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image too large. Please use a file under 8MB.");
      return;
    }
    setError(null);
    setMatches(null);
    setDetected([]);
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const { medicines } = await recognize({ data: { imageDataUrl: dataUrl } });
      setProgress(100);
      setDetected(medicines);
      const m = matchProducts(medicines);
      setMatches(m);
      showToast(m.length ? `Found ${m.length} matching product${m.length > 1 ? "s" : ""}` : "Scan complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
    fileRef.current?.click();
  };

  const reset = () => {
    setPreview(null);
    setMatches(null);
    setDetected([]);
    setError(null);
    setProgress(0);
  };

  return (
    <section
      id="upload"
      className="container mx-auto px-4 py-12"
      style={{ fontFamily: POPPINS }}
    >
      <div
        className="relative rounded-[2rem] overflow-hidden p-6 md:p-12 shadow-elegant"
        style={{ background: "linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 50%,#f0f9ff 100%)" }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl" />

        <div className="relative grid md:grid-cols-2 gap-8 items-stretch">
          {/* LEFT — info */}
          <div className="flex flex-col justify-center space-y-5">
            <span className="inline-flex self-start items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-700 bg-white/70 backdrop-blur-md border border-emerald-200 shadow-sm">
              <i className="fa-solid fa-wand-magic-sparkles text-emerald-500" /> AI Prescription Scanner
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
              Snap, scan & <span className="text-emerald-500">order</span> your medicines
            </h2>
            <p className="text-slate-600 max-w-md leading-relaxed">
              Upload a doctor's prescription, receipt, medicine box or strip. Our AI reads handwritten and printed text, then matches it instantly with our pharmacy catalog.
            </p>
            <ul className="grid grid-cols-2 gap-2 text-sm text-slate-700 max-w-md">
              {[
                ["fa-prescription", "Prescriptions"],
                ["fa-receipt", "Doctor receipts"],
                ["fa-box", "Medicine boxes"],
                ["fa-pills", "Medicine strips"],
                ["fa-pen-nib", "Handwritten"],
                ["fa-print", "Printed"],
              ].map(([ic, label]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="w-7 h-7 grid place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                    <i className={`fa-solid ${ic} text-xs`} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative rounded-3xl bg-white/70 backdrop-blur-xl border-2 border-dashed transition-all p-6 md:p-8 ${
              dragOver ? "border-emerald-500 bg-emerald-50/80 scale-[1.01]" : "border-emerald-200"
            }`}
          >
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />

            {!preview && !loading && (
              <div className="text-center py-6 animate-[fade-in_.4s_ease-out]">
                <div className="mx-auto w-20 h-20 rounded-3xl grid place-items-center text-white shadow-[0_15px_40px_-12px_rgba(16,185,129,0.7)] mb-4 animate-float"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                  <i className="fa-solid fa-cloud-arrow-up text-2xl" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Drag & drop your image</h3>
                <p className="text-sm text-slate-500 mt-1">or click below to upload from device or camera</p>

                <button
                  onClick={onUploadClick}
                  className="group relative overflow-hidden mt-5 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white shadow-[0_15px_40px_-12px_rgba(16,185,129,0.7)] hover:shadow-[0_20px_50px_-10px_rgba(16,185,129,0.9)] hover:scale-105 active:scale-95 transition-all duration-300"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                  {ripples.map((r) => (
                    <span key={r.id} className="absolute rounded-full bg-white/40 animate-[scale-in_.6s_ease-out]"
                      style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }} />
                  ))}
                  <i className="fa-solid fa-camera" /> Upload Now
                </button>
                <p className="text-[11px] text-slate-400 mt-3">Supports JPG, PNG · Max 8MB</p>
              </div>
            )}

            {(preview || loading) && (
              <div className="animate-[fade-in_.3s_ease-out]">
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video">
                  {preview && <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />}
                  {loading && (
                    <div className="absolute inset-0 grid place-items-center bg-white/40 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
                        <p className="text-sm text-emerald-700 font-semibold mt-3">AI scanning your image…</p>
                      </div>
                    </div>
                  )}
                </div>
                {loading && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{Math.round(progress)}% · OCR + medicine detection</p>
                  </div>
                )}
                {!loading && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
                    <div className="text-sm text-slate-600">
                      {detected.length > 0 ? (
                        <>Detected: <span className="font-semibold text-slate-900">{detected.slice(0, 4).join(", ")}</span></>
                      ) : (
                        "No medicine names detected."
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={onUploadClick} className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <i className="fa-solid fa-camera mr-2" /> New scan
                      </button>
                      <button onClick={reset} className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-100 hover:bg-slate-200">
                        <i className="fa-solid fa-rotate-left mr-2" /> Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <i className="fa-solid fa-circle-exclamation mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* RESULTS */}
        {loading && (
          <div className="relative mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-[fade-in_.3s_ease-out]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-sm overflow-hidden">
                <div className="aspect-square bg-emerald-100/60 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-6 w-1/2 bg-slate-200 rounded animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && matches && (
          <div className="relative mt-10 animate-[fade-in_.5s_ease-out]">
            {matches.length > 0 ? (
              <>
                <h4 className="text-xl md:text-2xl font-extrabold mb-5 text-slate-900">
                  <i className="fa-solid fa-circle-check text-emerald-500 mr-2" />
                  {matches.length} matching {matches.length === 1 ? "medicine" : "medicines"} found
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {matches.map((p) => <MatchCard key={p.id} p={p} onToast={showToast} />)}
                </div>
              </>
            ) : (
              <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white p-8 md:p-10 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 grid place-items-center">
                  <i className="fa-solid fa-triangle-exclamation text-2xl" />
                </div>
                <h4 className="text-xl font-extrabold mt-4 text-slate-900">No matching medicine found</h4>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  We couldn't match this prescription with our catalog. Try a clearer photo, or check these popular alternatives below.
                </p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  {suggestions.map((p) => <MatchCard key={p.id} p={p} onToast={showToast} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-[fade-in_.3s_ease-out]">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white shadow-2xl">
            <span className="w-7 h-7 grid place-items-center rounded-full bg-emerald-500">
              <i className="fa-solid fa-check text-xs" />
            </span>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function MatchCard({ p, onToast }: { p: Product; onToast: (m: string) => void }) {
  const { add } = useCart();
  const handleAdd = () => { add(p); onToast(`Added ${p.name} to cart`); };
  const handleBuy = () => { add(p); onToast(`Buying ${p.name} now…`); };
  return (
    <div className="group rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
      <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-sky-50 overflow-hidden">
        <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full ${p.inStock ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          {p.inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{p.brand}</div>
        <h5 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-slate-900">{p.name}</h5>
        <div className="text-lg font-extrabold text-emerald-600">${p.price}</div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={handleAdd} disabled={!p.inStock}
            className="text-xs font-semibold py-2 rounded-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-40">
            <i className="fa-solid fa-cart-plus mr-1" /> Add
          </button>
          <button onClick={handleBuy} disabled={!p.inStock}
            className="text-xs font-semibold py-2 rounded-full text-white shadow hover:scale-[1.03] transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <i className="fa-solid fa-bolt mr-1" /> Buy
          </button>
        </div>
      </div>
    </div>
  );
}
