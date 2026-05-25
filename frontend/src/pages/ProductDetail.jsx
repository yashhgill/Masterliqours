import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { Minus, Plus, Truck, ShieldCheck } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setP(r.data));
  }, [id]);

  if (!p) return <div className="max-w-7xl mx-auto px-8 py-20 cap-mono">// LOADING...</div>;

  const out = p.stock <= 0;

  return (
    <div data-testid={`product-detail-${id}`} className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <Link to="/shop" className="cap-mono hover:text-oxblood-500">← Back to shop</Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 mt-8">
        <div className="bg-white border border-bone-300 aspect-[4/5] flex items-center justify-center overflow-hidden relative paper">
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
          {p.featured && <div className="ribbon">Curator's Pick</div>}
        </div>

        <div>
          <div className="cap-mono">{p.brand} · {p.origin || "—"}</div>
          <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-[0.95] mt-3 text-ink-900">
            {p.name}
          </h1>

          <div className="mt-8 grid grid-cols-4 gap-4 border-y border-bone-300 py-6">
            {p.promo_price ? (
              <>
                <Stat label="Was" value={`RM${p.price_myr.toFixed(2)}`} strike />
                <Stat label="Price" value={`RM${Number(p.promo_price).toFixed(2)}`} highlight />
              </>
            ) : (
              <Stat label="Price" value={`RM${p.price_myr.toFixed(2)}`} highlight />
            )}
            <Stat label="ABV" value={`${p.abv}%`} />
            <Stat label="Volume" value={`${p.volume_ml}ml`} />
            <Stat label="Stock" value={out ? "0" : p.stock} state={out ? "out" : p.stock < 5 ? "low" : "ok"} />
          </div>

          <p className="font-body font-light text-ink-700 leading-relaxed mt-6">{p.description}</p>

          <div className="mt-10 flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-bone-300 bg-white">
              <button data-testid="qty-decr" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-oxblood-500">
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-6 font-mono font-bold">{qty}</span>
              <button data-testid="qty-incr" onClick={() => setQty((q) => q + 1)} className="p-3 hover:text-oxblood-500">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              data-testid="detail-add-to-cart"
              disabled={out}
              onClick={() => { addItem(p, qty); navigate("/cart"); }}
              className="btn-oxblood disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {out ? "Sold Out" : "Add to Cart →"}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Note Icon={Truck} title="Free delivery" body="On orders RM300+ across KL." />
            <Note Icon={ShieldCheck} title="ID on delivery" body="Valid 21+ ID required, no exceptions." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, state, strike }) {
  const cls = strike ? "text-ink-400 text-xl line-through" : highlight
    ? "text-oxblood-500 text-2xl"
    : state === "out"
    ? "text-ink-400 text-xl"
    : state === "low"
    ? "text-oxblood-500 text-xl neon-glow-pink"
    : "text-ink-900 text-xl";
  return (
    <div>
      <div className="cap-mono !text-[9px]">{label}</div>
      <div className={`font-mono font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}

function Note({ Icon, title, body }) {
  return (
    <div className="flex gap-3 border border-bone-300 bg-bone-100/50 p-4">
      <Icon className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
      <div>
        <div className="font-display font-bold text-sm text-ink-900">{title}</div>
        <div className="cap-mono !normal-case !tracking-normal !text-[12px] !text-ink-500 mt-0.5">{body}</div>
      </div>
    </div>
  );
}
