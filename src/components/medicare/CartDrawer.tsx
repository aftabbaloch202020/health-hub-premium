import { useCart } from "@/lib/cart";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, update, remove, subtotal, count, clear } = useCart();
  const delivery = subtotal > 30 || subtotal === 0 ? 0 : 4.99;
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + delivery + tax).toFixed(2);

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60] transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-card z-[70] shadow-elegant transition-transform duration-400 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 flex items-center justify-between border-b">
          <div className="flex items-center gap-2"><i className="fa-solid fa-bag-shopping text-primary" /><span className="font-bold">Your Cart ({count})</span></div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted grid place-items-center"><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa-solid fa-bag-shopping text-5xl text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Your cart is empty</p>
              <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-full bg-gradient-cta text-primary-foreground font-semibold">Continue shopping</button>
            </div>
          ) : items.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-3 p-3 rounded-2xl bg-muted/40">
              <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-contain bg-background" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{product.name}</div>
                <div className="text-xs text-muted-foreground">{product.brand}</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center bg-background rounded-full">
                    <button onClick={() => update(product.id, qty - 1)} className="w-7 h-7 grid place-items-center"><i className="fa-solid fa-minus text-xs" /></button>
                    <span className="px-2 text-sm font-semibold tabular-nums">{qty}</span>
                    <button onClick={() => update(product.id, qty + 1)} className="w-7 h-7 grid place-items-center"><i className="fa-solid fa-plus text-xs" /></button>
                  </div>
                  <span className="ml-auto font-bold text-primary">${(product.price * qty).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => remove(product.id)} className="text-muted-foreground hover:text-destructive self-start"><i className="fa-solid fa-trash" /></button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t p-5 space-y-3">
            <div className="flex gap-2">
              <input placeholder="Promo code" className="flex-1 px-4 py-2.5 rounded-full bg-muted outline-none text-sm" />
              <button className="px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">Apply</button>
            </div>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold">{delivery === 0 ? "Free" : `$${delivery}`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (5%)</span><span className="font-semibold">${tax}</span></div>
              <div className="flex justify-between pt-2 border-t text-base"><span className="font-bold">Total</span><span className="font-extrabold text-primary text-lg">${total}</span></div>
            </div>
            <button className="w-full py-3.5 rounded-full bg-gradient-cta text-primary-foreground font-semibold shadow-glow">
              Checkout <i className="fa-solid fa-arrow-right ml-2" />
            </button>
            <button onClick={clear} className="w-full text-xs text-muted-foreground hover:text-destructive">Clear cart</button>
          </div>
        )}
      </aside>
    </>
  );
}
