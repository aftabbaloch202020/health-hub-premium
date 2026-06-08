// Server-only helpers for order email notifications.
// Currently a best-effort stub: logs the order. Once a Lovable email domain is
// configured (or a Resend/SMTP connector is added), wire the actual send call
// inside `sendOrderEmail`.

type OrderRow = {
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string | null;
  items: Array<{ name: string; brand?: string; qty: number; pricePKR: number }>;
  subtotal_pkr: number;
  delivery_pkr: number;
  total_pkr: number;
  created_at: string;
};

const ADMIN_EMAIL = "aftabbaloch202020@gmail.com";

export async function sendOrderEmail(order: OrderRow) {
  const lines = (order.items ?? [])
    .map(
      (i) =>
        `  • ${i.name}${i.brand ? ` (${i.brand})` : ""} — qty ${i.qty} × PKR ${i.pricePKR} = PKR ${i.qty * i.pricePKR}`,
    )
    .join("\n");

  const body = [
    `New Order: ${order.order_number}`,
    `Date: ${new Date(order.created_at).toLocaleString()}`,
    ``,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Email: ${order.email}`,
    `Address: ${order.address}, ${order.city}`,
    order.notes ? `Notes: ${order.notes}` : null,
    ``,
    `Items:`,
    lines,
    ``,
    `Subtotal: PKR ${order.subtotal_pkr}`,
    `Delivery: PKR ${order.delivery_pkr}`,
    `Total:    PKR ${order.total_pkr}`,
  ]
    .filter(Boolean)
    .join("\n");

  // TODO: replace with actual send once email domain is configured.
  console.log(`[order-email] to=${ADMIN_EMAIL}\n${body}`);
}