import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { Copy, MessageCircle, CheckCircle2 } from "lucide-react";

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api.get("/config/storefront").then((r) => setCfg(r.data));
  }, []);

  useEffect(() => {
    if (!order && items.length === 0) navigate("/cart");
  }, [items, order, navigate]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1800);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone || !form.address) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price_myr: i.price_myr,
          quantity: i.quantity,
        })),
        payment_method: "bank_transfer",
      });
      setOrder(data);
      clear();
    } catch (err) {
      alert("Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const waText = order && cfg
    ? encodeURIComponent(
        `Hi Master Liquors, I'd like to confirm my order ${order.order_number}.\n\n` +
        order.items.map((i) => `• ${i.quantity}x ${i.name} — RM${(i.price_myr * i.quantity).toFixed(2)}`).join("\n") +
        `\n\nSubtotal: RM${order.subtotal.toFixed(2)}\nDelivery: ${order.delivery_fee === 0 ? "FREE" : `RM${order.delivery_fee.toFixed(2)}`}\nTotal: RM${order.total.toFixed(2)}\n\n` +
        `Name: ${order.customer_name}\nPhone: ${order.phone}\nAddress: ${order.address}\n` +
        (order.notes ? `Notes: ${order.notes}\n` : "") +
        `\nPayment: Bank transfer (receipt attached).`,
      )
    : "";

  const waLink = order && cfg ? `https://wa.me/${cfg.whatsapp_number}?text=${waText}` : "#";

  if (order && cfg) {
    return (
      <div data-testid="checkout-success" className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
        <span className="eyebrow text-neon-green" style={{ color: "#137a07" }}>// Order Received · {order.order_number}</span>
        <h1 className="font-display font-black text-4xl sm:text-6xl mt-4 tracking-tight text-ink-900 leading-[0.95]">
          One last <em className="italic text-oxblood-500">step.</em>
        </h1>
        <p className="font-body text-ink-600 mt-5 max-w-xl leading-relaxed">
          Transfer the total to our bank account, then ping us on WhatsApp with
          your payment receipt to confirm delivery. <em className="text-oxblood-500">Senang saja.</em>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          <div className="border-2 border-gold-500 p-7 paper bg-white relative">
            <div className="wax-seal absolute -top-5 -right-5" style={{ width: 56, height: 56, fontSize: "1.1rem" }}>1</div>
            <span className="cap-mono !text-gold-700">// Step 01 · Bank Transfer</span>
            <div className="mt-5">
              <BankRow label="Bank" value={cfg.bank_name} onCopy={() => copy(cfg.bank_name, "bn")} copied={copied === "bn"} />
              <BankRow label="Account Name" value={cfg.bank_account_name} onCopy={() => copy(cfg.bank_account_name, "an")} copied={copied === "an"} />
              <BankRow label="Account Number" value={cfg.bank_account_number} onCopy={() => copy(cfg.bank_account_number, "ac")} copied={copied === "ac"} testId="bank-acc-copy" />
              <BankRow label="Amount" value={`RM${order.total.toFixed(2)}`} onCopy={() => copy(order.total.toFixed(2), "am")} copied={copied === "am"} highlight />
              <BankRow label="Reference" value={order.order_number} onCopy={() => copy(order.order_number, "rf")} copied={copied === "rf"} />
            </div>
          </div>

          <div className="border-2 border-neon-whatsapp p-7 bg-white flex flex-col relative" style={{ borderColor: "#25D366" }}>
            <div className="wax-seal absolute -top-5 -right-5" style={{ width: 56, height: 56, fontSize: "1.1rem", background: "radial-gradient(circle at 30% 30%, #2eb05a, #1a7340 70%, #0e4a26)" }}>2</div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "#1A7340" }}>// Step 02 · Confirm on WhatsApp</span>
            <p className="font-body text-ink-700 mt-5 leading-relaxed mb-6">
              After transferring, tap below to send us your order details on
              WhatsApp. Attach your bank receipt screenshot in the chat and
              we&apos;ll dispatch the delivery within 60 minutes (KL area).
            </p>
            <a
              data-testid="checkout-whatsapp-btn"
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp mt-auto"
            >
              <MessageCircle className="w-5 h-5" /> Open WhatsApp →
            </a>
            <Link to="/" className="cap-mono hover:text-oxblood-500 mt-5 text-center">
              // Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="max-w-5xl mx-auto px-4 sm:px-8 py-14">
      <span className="eyebrow">// Finalise Order</span>
      <h1 className="font-display font-black text-5xl sm:text-7xl mt-4 tracking-tight text-ink-900">
        Check<em className="italic text-oxblood-500">out.</em>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <form onSubmit={submit} className="lg:col-span-2 space-y-6 border border-bone-300 bg-white p-7">
          <Field label="Full Name" testId="checkout-name" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} required />
          <Field label="Phone (WhatsApp)" testId="checkout-phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="60xxxxxxxxx" required />
          <Field label="Delivery Address" testId="checkout-address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required textarea />
          <Field label="Notes (Optional)" testId="checkout-notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />

          <button
            data-testid="checkout-submit"
            disabled={submitting || items.length === 0}
            type="submit"
            className="btn-oxblood w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing Order..." : "Place Order →"}
          </button>
          <p className="cap-mono text-center">// Bank details + WhatsApp handoff next</p>
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
            <div className="flex justify-between text-ink-500"><span>SUBTOTAL</span><span>RM{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-ink-500"><span>DELIVERY</span><span>{totals.delivery_fee === 0 ? "FREE" : `RM${totals.delivery_fee.toFixed(2)}`}</span></div>
          </div>
          <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-bone-300">
            <span className="cap-mono">Total</span>
            <span className="font-mono font-bold text-2xl text-oxblood-500">RM{totals.total.toFixed(2)}</span>
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

function BankRow({ label, value, onCopy, copied, highlight, testId }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-dashed border-bone-300 last:border-0">
      <div>
        <div className="cap-mono">{label}</div>
        <div className={`font-mono ${highlight ? "text-2xl text-oxblood-500 neon-glow-pink font-bold" : "text-base text-ink-900"}`}>
          {value}
        </div>
      </div>
      <button
        data-testid={testId}
        onClick={onCopy}
        className="cap-mono hover:text-oxblood-500 flex items-center gap-1.5"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" style={{ color: "#137a07" }} /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}
