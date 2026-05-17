import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeSkin, type SkinReport } from "@/lib/analyzeSkin.functions";
import { products, type Product, BRAND } from "@/data/products";
import { useCart } from "@/lib/cart";
import { Upload, ScanLine, Sparkles, ShoppingCart, AlertTriangle, ShieldAlert, CheckCircle2, X } from "lucide-react";

const fileToDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.onerror = () => rej(r.error);
  r.readAsDataURL(f);
});

function matchMedicines(keywords: string[]): Product[] {
  if (!keywords.length) return [];
  const kw = keywords.map((k) => k.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of products) {
    const hay = `${p.name} ${p.brand}`.toLowerCase();
    if (kw.some((k) => k && hay.includes(k.split(" ")[0]))) {
      if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
      if (out.length >= 6) break;
    }
  }
  return out;
}

const severityColor = (s: string) => s === "severe" ? "bg-rose-100 text-rose-700" : s === "moderate" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
const urgencyMeta = (u: SkinReport["urgency"]) => u === "urgent"
  ? { color: "bg-rose-500", text: "Seek urgent medical care", Icon: ShieldAlert }
  : u === "see-doctor-soon"
  ? { color: "bg-amber-500", text: "Consult a doctor soon", Icon: AlertTriangle }
  : { color: "bg-emerald-500", text: "Self-care may be appropriate", Icon: CheckCircle2 };

export default function SkinAnalysis() {
  const run = useServerFn(analyzeSkin);
  const { add } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SkinReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const onPick = async (f: File | undefined | null) => {
    if (!f) return;
    setErr(null); setReport(null);
    if (!f.type.startsWith("image/")) { setErr("Please upload an image file."); return; }
    if (f.size > 8 * 1024 * 1024) { setErr("Image too large (max 8 MB)."); return; }
    const url = await fileToDataUrl(f);
    setPreview(url);
  };

  const scan = async () => {
    if (!preview) return;
    setLoading(true); setErr(null); setReport(null);
    try {
      const r = await run({ data: { imageDataUrl: preview, note } });
      setReport(r);
    } catch (e: any) {
      setErr(e?.message || "Analysis failed.");
    } finally { setLoading(false); }
  };

  const reset = () => { setPreview(null); setReport(null); setErr(null); setNote(""); };

  const meds = report ? matchMedicines(report.medicineKeywords) : [];
  const urg = report ? urgencyMeta(report.urgency) : null;

  return (
    <section id="skin-ai" className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
            <ScanLine className="w-3.5 h-3.5" /> AI Skin Disease Detection
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">Scan a Skin Concern</h2>
          <p className="mt-3 text-slate-600">Upload a clear photo of skin, hands, face, nails, or affected area. The AI will suggest possible conditions and matching pharmacy products.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {/* Upload */}
          <div className="lg:col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files?.[0]); }}
              className={`relative rounded-2xl border-2 border-dashed transition aspect-[4/5] flex items-center justify-center overflow-hidden ${drag ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-slate-50"}`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={reset} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 grid place-items-center hover:bg-white shadow"><X className="w-4 h-4" /></button>
                  {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                      <p className="mt-4 text-sm">Scanning image…</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center px-6">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center text-white shadow-lg"><Upload className="w-7 h-7" /></div>
                  <p className="mt-4 font-semibold text-slate-700">Drop image or tap to upload</p>
                  <p className="text-xs text-slate-500">JPG · PNG · HEIC · max 8 MB</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPick(e.target.files?.[0])} />
              {!preview && <button onClick={() => inputRef.current?.click()} className="absolute inset-0" aria-label="Upload" />}
            </div>

            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional: describe symptoms (itching, duration, area)" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-20" />

            <div className="mt-4 flex gap-2">
              <button onClick={() => inputRef.current?.click()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:border-purple-400 px-4 py-2.5 text-sm font-semibold transition">
                <Upload className="w-4 h-4" /> Choose
              </button>
              <button onClick={scan} disabled={!preview || loading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-4 py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
                <Sparkles className="w-4 h-4" /> {loading ? "Scanning…" : "Analyze"}
              </button>
            </div>
            {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
          </div>

          {/* Report */}
          <div className="lg:col-span-3 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6 min-h-[400px]">
            {!report && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <div className="w-20 h-20 rounded-full bg-purple-100 grid place-items-center mb-4"><ScanLine className="w-9 h-9 text-purple-500" /></div>
                <p className="font-semibold text-slate-700">Your AI dermatology report will appear here</p>
                <p className="text-sm mt-1">Upload an image and tap Analyze.</p>
              </div>
            )}
            {loading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 w-1/2 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-24 bg-slate-200 rounded-xl" />
                <div className="h-24 bg-slate-200 rounded-xl" />
              </div>
            )}
            {report && urg && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">{report.bodyArea}</div>
                  <h3 className="text-2xl font-bold text-slate-900">AI Dermatology Report</h3>
                  <p className="text-sm text-slate-600 mt-1">{report.summary}</p>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl text-white p-4 ${urg.color}`}>
                  <urg.Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{urg.text}</div>
                    <div className="text-xs opacity-90">Overall AI confidence: {report.overallConfidence}%</div>
                  </div>
                </div>

                {report.findings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">Possible conditions</h4>
                    {report.findings.map((f, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="font-semibold text-slate-900">{f.condition}</div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${severityColor(f.severity)}`}>{f.severity}</span>
                            <span className="text-xs text-slate-500">{f.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  {report.treatments.length > 0 && (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <h4 className="font-semibold text-emerald-800 text-sm mb-2">Treatment suggestions</h4>
                      <ul className="text-sm text-emerald-900/80 space-y-1">{report.treatments.map((t, i) => <li key={i}>• {t}</li>)}</ul>
                    </div>
                  )}
                  {report.skincare.length > 0 && (
                    <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
                      <h4 className="font-semibold text-sky-800 text-sm mb-2">Skincare tips</h4>
                      <ul className="text-sm text-sky-900/80 space-y-1">{report.skincare.map((t, i) => <li key={i}>• {t}</li>)}</ul>
                    </div>
                  )}
                </div>

                {meds.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Available at Darman Store</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {meds.map((p) => (
                        <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3 flex gap-3 hover:shadow-md transition">
                          <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-900 truncate">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.brand}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-emerald-600">{BRAND.currency}{p.price.toFixed(2)}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.inStock ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.inStock ? "In stock" : "Out"}</span>
                            </div>
                            <button onClick={() => add(p, 1)} disabled={!p.inStock} className="mt-2 w-full inline-flex items-center justify-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-1.5 transition">
                              <ShoppingCart className="w-3 h-3" /> Quick Buy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  Disclaimer: AI analysis is informational and not a medical diagnosis. Please consult a licensed dermatologist for confirmation and treatment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}