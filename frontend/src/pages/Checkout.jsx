import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { MessageCircle, CheckCircle2 } from "lucide-react";

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!order && items.length === 0) navigate("/cart");
  }, [items, order, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone || !form.address) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer_name: form.customer_name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price_myr: i.price_myr,
          quantity: i.quantity,
        })),
        total: totals.total,
      });
      setOrder(data);
      clear();
    } catch (err) {
      alert("Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const buildWaMessage = (o) => {
    const itemsList = (o.items || [])
      .map((i) => `• ${i.quantity}x ${i.name} — RM${(i.price_myr * i.quantity).toFixed(2)}`)
      .join("\n");
    return encodeURIComponent(
      `Hi Master Liquors! 🥃 I'd like to place an order.\n\n` +
      `*Order ID:* ${o.order_number || o.orderId}\n` +
      `*Name:* ${o.customer_name || o.customer?.name}\n` +
      `*Phone:* ${o.phone || o.customer?.phone}\n` +
      `*Address:* ${o.address || o.customer?.address}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `*Total: RM${Number(o.total).toFixed(2)}*\n` +
      (o.notes ? `*Notes:* ${o.notes}\n` : "") +
      `\nPlease confirm my order. Thank you!`
    );
  };

  if (order) {
    const waNumber = process.env.REACT_APP_WHATSAPP_NUMBER || "60182085097";
    const waLink = `https://wa.me/${waNumber}?text=${buildWaMessage(order)}`;

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16" style={{ color: "#25D366" }} />
        </div>
        <span className="eyebrow" style={{ color: "#137a07" }}>
          // Order {order.order_number || order.orderId} Received
        </span>
        <h1 className="font-display font-black text-4xl sm:text-6xl mt-4 tracking-tight text-ink-900">
          One last <em className="italic text-oxblood-500">step.</em>
        </h1>
        <p className="font-body text-ink-600 mt-5 max-w-md mx-auto leading-relaxed">
          Your order is saved! Tap below to send it to us on WhatsApp — our team
          will confirm and handle delivery personally.{" "}
          <em className="text-oxblood-500">Senang saja.</em>
        </p>

        <div className="mt-10 border-2 p-8 bg-white text-left" style={{ borderColor: "#25D366" }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "#1A7340" }}>
            // Confirm on WhatsApp
          </span>
          <p className="font-body text-ink-700 mt-4 leading-relaxed">
            Tap the button below — it will open WhatsApp with your order
            pre-filled. Send it and our team will get back to you within minutes.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp mt-6 w-full justify-center"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <MessageCircle className="w-5 h-5" />
            Open WhatsApp →
          </a>
        </div>

        <Link to="/" className="cap-mono hover:text-oxblood-500 mt-8 block">
          // Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14">
      <span className="eyebrow">// Finalise Order</span>
      <h1 className="font-display font-black text-5xl sm:text-7xl mt-4 tracking-tight text-ink-900">
        Check<em className="italic text-oxblood-500">out.</em>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <form onSubmit={submit} className="lg:col-span-2 space-y-6 border border-bone-300 bg-white p-7">
          <Field
            label="Full Name"
            testId="checkout-name"
            value={form.customer_name}
            onChange={(v) => setForm({ ...form, customer_name: v })}
            required
          />
          <Field
            label="Phone (WhatsApp)"
            testId="checkout-phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="60xxxxxxxxx"
            required
          />
          <Field
            label="Delivery Address"
            testId="checkout-address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            required
            textarea
          />
          <Field
            label="Notes (Optional)"
            testId="checkout-notes"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            textarea
          />

          <button
            disabled={submitting || items.length === 0}
            type="submit"
            className="btn-oxblood w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing Order..." : "Place Order & Open WhatsApp →"}
          </button>
          <p className="cap-mono text-center">// Our team will contact you on WhatsApp</p>
        </form>

        <aside className="border border-bone-300 bg-bone-100 p-6 h-fit paper">
          <div className="cap-mono mb-4">// Summary</div>
          <div className="space-y-2 font-mono text-sm border-b border-dashed border-bone-300 pb-4">
            {items.map((i) => (
              <div key={i.product_id} className="flex justify-between gap-2">
                <span className="text-ink-700 truncate">{i.quantity}× {i.name}</span>
                <span className="text-ink-500 shrink-0">RM{(i.price_myr * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="font-mono text-sm space-y-1 mt-4 text-ink-700">
            <div className="flex justify-between text-ink-500">
              <span>SUBTOTAL</span>
              <span>RM{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>DELIVERY</span>
              <span>{totals.delivery_fee === 0 ? "FREE" : `RM${totals.delivery_fee.toFixed(2)}`}</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-bone-300">
            <span className="cap-mono">Total</span>
            <span className="font-mono font-bold text-2xl text-oxblood-500">
              RM{totals.total.toFixed(2)}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, testId, ...rest }) {
  return (
    <div>
      <span className="label-paper">{label}</span>
      {textarea ? (
        <textarea
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="input-paper resize-none"
          {...rest}
        />
      ) : (
        <input
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-paper"
          {...rest}
        />
      )}
    </div>
  );
}
