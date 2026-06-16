import { createFileRoute } from "@tanstack/react-router";
import Firecrawl from "@mendable/firecrawl-js";

type ScrapedProduct = {
  name?: string;
  image?: string;
  price_pkr?: number | string;
  in_stock?: boolean | string;
  url?: string;
};

const SHOP_PAGES = [
  "https://www.timemedico.com.pk/shop/",
  "https://www.timemedico.com.pk/shop/page/2/",
  "https://www.timemedico.com.pk/shop/page/3/",
  "https://www.timemedico.com.pk/shop/page/4/",
  "https://www.timemedico.com.pk/shop/page/5/",
];

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Medicine product name" },
          image: { type: "string", description: "Absolute URL of the product image" },
          price_pkr: { type: "number", description: "Price in PKR as a number, no currency symbol" },
          in_stock: { type: "boolean", description: "True if the product is available/in stock" },
          url: { type: "string", description: "Absolute URL of the product detail page" },
        },
        required: ["name"],
      },
    },
  },
  required: ["products"],
} as const;

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toAvailability(v: unknown): string {
  if (typeof v === "boolean") return v ? "in_stock" : "out_of_stock";
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (s.includes("out")) return "out_of_stock";
    if (s.includes("in") || s.includes("available") || s === "true") return "in_stock";
  }
  return "unknown";
}

export const Route = createFileRoute("/api/public/hooks/sync-medicines")({
  server: {
    handlers: {
      POST: async () => runSync(),
      GET: async () => runSync(),
    },
  },
});

async function runSync(): Promise<Response> {
  const start = Date.now();
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "FIRECRAWL_API_KEY missing" }, { status: 500 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    const firecrawl = new Firecrawl({ apiKey });
    const all: ScrapedProduct[] = [];

    for (const page of SHOP_PAGES) {
      try {
        const result: any = await firecrawl.scrape(page, {
          formats: [{ type: "json", schema: EXTRACT_SCHEMA as any }],
          onlyMainContent: true,
          waitFor: 1500,
        });
        const json = result?.json ?? result?.data?.json;
        const products: ScrapedProduct[] = Array.isArray(json?.products) ? json.products : [];
        for (const p of products) all.push(p);
      } catch (e) {
        console.error(`[sync] page failed: ${page}`, e);
      }
    }

    // dedupe + normalize
    const seen = new Set<string>();
    const rows = all
      .map((p) => {
        const name = (p.name ?? "").trim();
        const url = (p.url ?? "").trim();
        const sourceUrl = url || `https://www.timemedico.com.pk/?p=${encodeURIComponent(name)}`;
        if (!name) return null;
        if (seen.has(sourceUrl)) return null;
        seen.add(sourceUrl);
        return {
          source: "timemedico",
          source_url: sourceUrl,
          name,
          image_url: (p.image ?? "").trim() || null,
          price_pkr: toNumber(p.price_pkr),
          availability: toAvailability(p.in_stock),
          last_seen_at: new Date().toISOString(),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    let upserted = 0;
    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from("external_medicines")
        .upsert(rows, { onConflict: "source_url" });
      if (error) throw new Error(error.message);
      upserted = rows.length;
    }

    const duration = Date.now() - start;
    await supabaseAdmin.from("sync_logs").insert({
      source: "timemedico",
      status: upserted > 0 ? "success" : "empty",
      items_synced: upserted,
      duration_ms: duration,
    });

    return Response.json({ ok: true, items_synced: upserted, duration_ms: duration });
  } catch (err: any) {
    const duration = Date.now() - start;
    await supabaseAdmin.from("sync_logs").insert({
      source: "timemedico",
      status: "error",
      items_synced: 0,
      error: String(err?.message ?? err).slice(0, 1000),
      duration_ms: duration,
    });
    return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}