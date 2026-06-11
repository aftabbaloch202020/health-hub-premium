import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { placeOrder, placeOrderAuthed } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatPKR } from "@/lib/medicines";
import { supabase } from "@/integrations/supabase/client";

const USD_TO_PKR = 280;

export default function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, clear } = useCart();
  const place = useServerFn(placeOrder);
  const placeAuthed = useServerFn(placeOrderAuthed);
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setIsAuthed(!!u);
      if (u) setForm((f) => ({
        ...f,
        email: f.email || u.email || "",
        customer_name: f.customer_name || (u.user_metadata?.full_name as string) || "",
      }));
    });
  }, [open]);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const subtotalPKR = Math.round(subtotal * USD_TO_PKR);
  const deliveryPKR = subtotalPKR === 0 || subtotalPKR > 3000 ? 0 : 200;
  const totalPKR = subtotalPKR + deliveryPKR;

  if (!open) return null;

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (items.length === 0) return "Your cart is empty.";
    if (form.customer_name.trim().length < 2) return "Please enter your full name.";
    if (!/^[+\d][\d\s\-()]{6,20}$/.test(form.phone.trim())) return "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email.";
    if (form.address.trim().length < 5) return "Please enter your full delivery address.";
    if (form.city.trim().length < 2) return "Please enter your city.";
    return null;
  };

  const onReview = () => {
    const err = validate();
    if (err) return toast.error(err);
    setStep("review");
  };

  const onPlace = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          brand: i.product.brand,
          image: i.product.image,
          qty: i.qty,
          pricePKR: Math.round(i.product.price * USD_TO_PKR),
        })),
        subtotal_pkr: subtotalPKR,
        delivery_pkr: deliveryPKR,
        total_pkr: totalPKR,
      };
      const res = isAuthed
        ? await placeAuthed({ data: payload })
        : await place({ data: payload });
      setOrderNumber(res.order_number);
      setStep("success");
      clear();
    } catch (e) {
      toast.error((e as Error).message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("form");
    setOrderNumber(null);
    setForm({ customer_name: "", phone: "", email: "", address: "", city: "", notes: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-foreground/50 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onClick={step === "success" ? reset : onClose}>
      <div className="bg-card rounded-3xl shadow-elegant w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <i className="fa-solid fa-bag-shopping text-primary" />
            {step === "form" ? "Checkout" : step === "review" ? "Review Order" : "Order Placed"}
          </h2>
          <button onClick={reset} className="w-9 h-9 rounded-full hover:bg-muted grid place-items-center"><i className="fa-solid fa-xmark" /></button>
        </div>

        {step === "form" && (
          <div className="p-5 space-y-3">
            <Field label="Full Name *"><input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} className={inp} placeholder="Aftab Baloch" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone *"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inp} placeholder="+92 300 1234567" /></Field>
              <Field label="Email *"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inp} placeholder="you@example.com" /></Field>
            </div>
            <Field label="Delivery Address *"><textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} className={inp} placeholder="House #, Street, Area" /></Field>
            <Field label="City *"><input value={form.city} onChange={(e) => set("city", e.target.value)} className={inp} placeholder="Karachi" /></Field>
            <Field label="Notes (optional)"><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp} placeholder="Landmark, delivery time…" /></Field>

            <div className="rounded-2xl bg-muted/40 p-4 text-sm space-y-1">
              <Row label="Items"><span>{items.reduce((s, i) => s + i.qty, 0)}</span></Row>
              <Row label="Subtotal"><span>{formatPKR(subtotalPKR)}</span></Row>
              <Row label="Delivery"><span>{deliveryPKR === 0 ? "Free" : formatPKR(deliveryPKR)}</span></Row>
              <div className="border-t pt-2 mt-2 flex justify-between font-extrabold text-base"><span>Total</span><span className="text-primary">{formatPKR(totalPKR)}</span></div>
            </div>

            <button onClick={onReview} disabled={items.length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-40">
              Review Order <i className="fa-solid fa-arrow-right ml-2" />
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="p-5 space-y-4">
            <div className="rounded-2xl bg-muted/40 p-4 text-sm space-y-1">
              <div className="font-bold text-base mb-2">Delivery to</div>
              <div>{form.customer_name}</div>
              <div className="text-muted-foreground">{form.phone} · {form.email}</div>
              <div className="text-muted-foreground">{form.address}, {form.city}</div>
              {form.notes && <div className="text-muted-foreground italic mt-1">Note: {form.notes}</div>}
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-2 bg-muted/60 font-bold text-sm">Ordered Items</div>
              <div className="divide-y">
                {items.map(({ product, qty }) => {
                  const p = Math.round(product.price * USD_TO_PKR);
                  return (
                    <div key={product.id} className="p-3 flex gap-3 items-center">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-contain bg-background" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground">qty {qty} × {formatPKR(p)}</div>
                      </div>
                      <div className="font-bold text-primary">{formatPKR(p * qty)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4 text-sm space-y-1">
              <Row label="Subtotal"><span>{formatPKR(subtotalPKR)}</span></Row>
              <Row label="Delivery"><span>{deliveryPKR === 0 ? "Free" : formatPKR(deliveryPKR)}</span></Row>
              <div className="border-t pt-2 mt-2 flex justify-between font-extrabold text-base"><span>Total</span><span className="text-primary">{formatPKR(totalPKR)}</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("form")} className="flex-1 py-3 rounded-2xl bg-muted hover:bg-accent font-semibold">
                <i className="fa-solid fa-arrow-left mr-2" /> Edit
              </button>
              <button onClick={onPlace} disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-60">
                {submitting ? <><i className="fa-solid fa-spinner animate-spin mr-2" />Placing…</> : <>Place Order <i className="fa-solid fa-check ml-2" /></>}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/15 grid place-items-center mx-auto mb-4">
              <i className="fa-solid fa-circle-check text-4xl text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold mb-2">Thank you, {form.customer_name.split(" ")[0] || "friend"}!</h3>
            <p className="text-muted-foreground mb-4">Your order has been received. We've notified our team.</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted font-mono font-bold">
              <i className="fa-solid fa-receipt text-primary" />
              {orderNumber}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Save this Order ID — you'll need it to track your order.</p>
            <button onClick={reset} className="mt-6 px-6 py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-bold shadow-soft">
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border outline-none focus:ring-2 focus:ring-primary/40 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span>{children}</div>;
}