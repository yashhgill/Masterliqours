import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const lowStock = product.stock > 0 && product.stock < 5;
  const out = product.stock <= 0;

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="card-product group relative"
    >
      {product.featured && <div className="ribbon">Curator's Pick</div>}

      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-bone-100 flex items-center justify-center relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {out && (
            <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] bg-white/90 border border-ink-300 px-2 py-1 text-ink-500">
              SOLD OUT
            </span>
          )}
          {lowStock && (
            <span className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-[0.2em] bg-oxblood-500 text-bone-50 px-2 py-1 neon-glow-pink">
              ONLY {product.stock} LEFT
            </span>
          )}
          {!lowStock && !out && (
            <span className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-[0.2em] bg-white/90 border border-gold-500 text-gold-700 px-2 py-1">
              {product.category}
            </span>
          )}
        </div>

        <div className="p-5 border-t border-bone-200">
          <div className="cap-mono">{product.brand} · {product.origin || "—"}</div>
          <h3 className="font-display font-bold text-lg leading-tight mt-1 line-clamp-2 text-ink-900">
            {product.name}
          </h3>

          <div className="flex items-end justify-between mt-4">
            <div>
              <div className="cap-mono !text-[9px]">Price</div>
              {product.promo_price ? (
                <div>
                  <span className="font-mono text-sm text-ink-400 line-through mr-2">RM{product.price_myr.toFixed(2)}</span>
                  <span className="font-mono font-bold text-xl text-oxblood-500">RM{Number(product.promo_price).toFixed(2)}</span>
                </div>
              ) : (
                <div className="font-mono font-bold text-xl text-oxblood-500">
                  RM{product.price_myr.toFixed(2)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="cap-mono !text-[9px]">ABV · Vol</div>
              <div className="font-mono text-xs text-ink-700">
                {product.abv}% · {product.volume_ml}ml
              </div>
            </div>
          </div>
        </div>
      </Link>

      <button
        data-testid={`add-to-cart-${product.id}`}
        disabled={out}
        onClick={() => addItem(product, 1)}
        className="btn-gold-outline w-full !text-[0.75rem] !py-3 border-t-0 disabled:opacity-40 disabled:cursor-not-allowed justify-center"
      >
        {out ? "Sold Out" : "+ Add to Cart"}
      </button>
    </div>
  );
}
