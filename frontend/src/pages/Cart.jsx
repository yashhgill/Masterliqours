import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, updateQty, removeItem, totals, clear } = useCart();

  return (
    <div data-testid="cart-page" className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
      <span className="eyebrow">// Your Stash</span>
      <h1 className="font-display font-black text-5xl sm:text-7xl mt-4 tracking-tight text-ink-900">
        The <em className="italic text-oxblood-500">Cart.</em>
      </h1>

      {items.length === 0 ? (
        <div data-testid="cart-empty" className="mt-16 border border-bone-300 bg-white p-16 text-center paper">
          <ShoppingBag className="w-10 h-10 text-ink-300 mx-auto mb-4" />
          <div className="cap-mono mb-4">// Cart is empty</div>
          <p className="font-body text-ink-600 mb-8">Nothing here yet. Time to fix that.</p>
          <Link to="/shop" className="btn-oxblood">Browse the Cellar →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it) => (
              <div
                key={it.product_id}
                data-testid={`cart-item-${it.product_id}`}
                className="flex items-center gap-4 border border-bone-300 p-3 bg-white"
              >
                <img src={it.image_url} alt={it.name} className="w-20 h-24 object-cover bg-bone-100" />
                <div className="flex-1 min-w-0">
                  <div className="cap-mono">{it.brand}</div>
                  <div className="font-display font-bold text-base text-ink-900 leading-tight truncate mt-0.5">
                    {it.name}
                  </div>
                  <div className="font-mono text-sm text-oxblood-500 mt-1">RM{it.price_myr.toFixed(2)}</div>
                </div>
                <div className="flex items-center border border-bone-300">
                  <button onClick={() => updateQty(it.product_id, it.quantity - 1)} className="p-2 hover:text-oxblood-500"><Minus className="w-3 h-3" /></button>
                  <span className="px-3 font-mono text-sm font-bold">{it.quantity}</span>
                  <button onClick={() => updateQty(it.product_id, it.quantity + 1)} className="p-2 hover:text-oxblood-500"><Plus className="w-3 h-3" /></button>
                </div>
                <button
                  data-testid={`cart-remove-${it.product_id}`}
                  onClick={() => removeItem(it.product_id)}
                  className="p-2 text-ink-400 hover:text-oxblood-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              data-testid="cart-clear"
              onClick={clear}
              className="cap-mono hover:text-oxblood-500 mt-4"
            >
              // Clear cart
            </button>
          </div>

          <aside className="border border-bone-300 bg-white p-6 h-fit shadow-sm">
            <div className="cap-mono mb-4">// Receipt</div>
            <div className="font-mono text-sm space-y-2 border-b border-dashed border-bone-300 pb-4 text-ink-700">
              <Row label="SUBTOTAL" value={`RM${totals.subtotal.toFixed(2)}`} />
              <Row label="DELIVERY" value={totals.delivery_fee === 0 ? "FREE" : `RM${totals.delivery_fee.toFixed(2)}`} />
            </div>
            <div className="flex justify-between items-baseline mt-4">
              <span className="cap-mono">Total</span>
              <span className="font-mono font-bold text-2xl text-oxblood-500 neon-glow-pink" data-testid="cart-total">
                RM{totals.total.toFixed(2)}
              </span>
            </div>

            <Link to="/checkout" data-testid="cart-checkout-btn" className="btn-oxblood w-full mt-6 justify-center">
              Proceed to Checkout →
            </Link>
            <div className="cap-mono mt-3 text-center">// Bank transfer + WhatsApp confirm</div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}
