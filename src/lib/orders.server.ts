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

  // Best-effort live send via Lovable Email service route if available.
  // Falls back to a log entry (visible in server logs) when email isn't configured.
  const subject = `New Order ${order.order_number} — Darman STORE`;
  try {
    const base = process.env.LOVABLE_PUBLIC_URL || process.env.SUPABASE_URL?.replace(/\.supabase\.co.*/, "") || "";
    // Attempt the queue-based transactional sender (no-op if not scaffolded yet)
    const url = `${base}/lovable/email/transactional/send`;
    await Promise.allSettled([
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: "order-admin",
          recipientEmail: ADMIN_EMAIL,
          idempotencyKey: `order-admin-${order.order_number}`,
          templateData: { order, subject, body },
        }),
      }),
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: "order-customer",
          recipientEmail: order.email,
          idempotencyKey: `order-customer-${order.order_number}`,
          templateData: { order, subject, body },
        }),
      }),
    ]);
  } catch {
    /* ignore */
  }
  console.log(`[order-email] queued → admin=${ADMIN_EMAIL}, customer=${order.email}\n${body}`);
}