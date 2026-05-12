import { useEffect, useState, useCallback } from "react";
import type { Product } from "@/data/products";

export type CartItem = { product: Product; qty: number };
const KEY = "medicare:cart";
const WL_KEY = "medicare:wishlist";

const read = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (items: CartItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:update"));
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener("cart:update", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("cart:update", h); window.removeEventListener("storage", h); };
  }, []);

  const add = useCallback((p: Product, qty = 1) => {
    const cur = read();
    const i = cur.findIndex(c => c.product.id === p.id);
    if (i >= 0) cur[i].qty += qty; else cur.push({ product: p, qty });
    write(cur);
  }, []);
  const remove = useCallback((id: string) => write(read().filter(c => c.product.id !== id)), []);
  const update = useCallback((id: string, qty: number) => {
    const cur = read().map(c => c.product.id === id ? { ...c, qty: Math.max(1, qty) } : c);
    write(cur);
  }, []);
  const clear = useCallback(() => write([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.product.price, 0);
  return { items, add, remove, update, clear, count, subtotal };
}

const readWL = (): string[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WL_KEY) || "[]"); } catch { return []; }
};
export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(readWL());
    const h = () => setIds(readWL());
    window.addEventListener("wl:update", h);
    return () => window.removeEventListener("wl:update", h);
  }, []);
  const toggle = (id: string) => {
    const cur = readWL();
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    localStorage.setItem(WL_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("wl:update"));
  };
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
