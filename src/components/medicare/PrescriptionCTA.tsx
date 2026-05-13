import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recognizeMedicine } from "@/lib/recognize.functions";
import { products, type Product } from "@/data/products";
import ProductCard from "./ProductCard";

function matchProducts(names: string[]): Product[] {
  if (!names.length) return [];
  const tokens = names
    .flatMap((n) => n.toLowerCase().split(/\s+/))
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 3);
  if (!tokens.length) return [];
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of products) {
    const hay = `${p.name} ${p.brand}`.toLowerCase();
    if (tokens.some((t) => hay.includes(t)) && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out.slice(0, 8);
}

const fileToDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });

export default function PrescriptionCTA() {
  const fileRef = useRef<HTMLInputElement>(null);
  const recognize = useServerFn(recognizeMedicine);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [matches, setMatches] = useState<Product[] | null>(null);
  const [detected, setDetected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setMatches(null);
    setDetected([]);
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const { medicines } = await recognize({ data: { imageDataUrl: dataUrl } });
      setDetected(medicines);
      setMatches(matchProducts(medicines));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setMatches(null);
    setDetected([]);
    setError(null);
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl p-8 md:p-10 bg-card shadow-card hover-lift relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-cta opacity-10 rounded-full -translate-y-10 translate-x-10" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-cta text-primary-foreground grid place-items-center mb-4">
            <i className="fa-solid fa-prescription text-xl" />
          </div>
          <h3 className="text-2xl font-extrabold">Upload your prescription</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Snap a photo of your prescription, medicine box or strip. Our AI will detect the medicine and show matching products instantly.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPick}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="px-6 py-3 rounded-full bg-gradient-cta text-primary-foreground font-semibold disabled:opacity-60"
            >
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2" />Analyzing…</>
              ) : (
                <><i className="fa-solid fa-camera mr-2" />Upload Now</>
              )}
            </button>
            {(preview || matches) && !loading && (
              <button onClick={reset} className="px-5 py-3 rounded-full bg-muted font-semibold">
                <i className="fa-solid fa-rotate-left mr-2" />Reset
              </button>
            )}
          </div>

          {preview && (
            <div className="mt-5 flex items-center gap-3">
              <img src={preview} alt="Uploaded" className="w-20 h-20 rounded-xl object-cover border border-border" />
              <div className="text-sm text-muted-foreground">
                {loading
                  ? "Reading medicine names with AI…"
                  : detected.length
                  ? <>Detected: <span className="font-semibold text-foreground">{detected.join(", ")}</span></>
                  : !error && "No medicine names detected."}
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="rounded-3xl p-8 md:p-10 glass shadow-card hover-lift relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary opacity-20 rounded-full translate-y-12 -translate-x-12" />
          <div className="w-14 h-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mb-4">
            <i className="fa-solid fa-robot text-xl" />
          </div>
          <h3 className="text-2xl font-extrabold">AI Medicine Finder</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Describe your symptoms and our AI will recommend over-the-counter remedies & wellness products.</p>
          <button className="mt-5 px-6 py-3 rounded-full bg-secondary text-secondary-foreground font-semibold">
            <i className="fa-solid fa-wand-magic-sparkles mr-2" />Try AI Assistant
          </button>
        </div>
      </div>

      {matches && (
        <div className="mt-8">
          {matches.length > 0 ? (
            <>
              <h4 className="text-xl font-extrabold mb-4">
                <i className="fa-solid fa-circle-check text-success mr-2" />
                {matches.length} matching {matches.length === 1 ? "medicine" : "medicines"} found
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {matches.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center bg-card/50">
              <i className="fa-solid fa-triangle-exclamation text-4xl text-warning mb-3" />
              <h4 className="text-lg font-bold">
                {detected.length ? "No matching medicine found" : "Medicine not available"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Try a clearer photo of the medicine name or contact our pharmacist for help.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
