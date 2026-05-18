import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";

const SORTS = [
  { id: "new", label: "NEW" },
  { id: "price_asc", label: "PRICE ↑" },
  { id: "price_desc", label: "PRICE ↓" },
  { id: "abv_desc", label: "ABV ↓" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("new");

  const category = params.get("category") || "all";
  const search = params.get("search") || "";
  const featuredFilter = params.get("featured") === "true";

  useEffect(() => {
    api.get("/products/categories").then((r) => setCats(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qp = { category, search };
    if (featuredFilter) qp.featured = true;
    api
      .get("/products", { params: qp })
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [category, search, featuredFilter]);

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "price_asc") arr.sort((a, b) => a.price_myr - b.price_myr);
    else if (sort === "price_desc") arr.sort((a, b) => b.price_myr - a.price_myr);
    else if (sort === "abv_desc") arr.sort((a, b) => b.abv - a.abv);
    return arr;
  }, [products, sort]);

  const setCategory = (c) => {
    const next = new URLSearchParams(params);
    if (c === "all") next.delete("category");
    else next.set("category", c);
    next.delete("featured");
    setParams(next);
  };

  return (
    <div data-testid="shop-page" className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
      <span className="eyebrow">// The Cellar</span>
      <h1 className="font-display font-black text-5xl sm:text-7xl mt-4 tracking-tight text-ink-900">
        Shop <em className="italic text-oxblood-500">Everything.</em>
      </h1>
      <div className="dual-lang mt-3 text-sm">
        <span className="han">所有美酒</span>
        <span className="text-bone-400">·</span>
        <span className="ta">அனைத்து மது</span>
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-bone-300 pb-5">
        <button
          data-testid="cat-all"
          onClick={() => setCategory("all")}
          className={`font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-2 border transition-colors ${
            category === "all" && !featuredFilter
              ? "border-oxblood-500 text-oxblood-500 bg-oxblood-50"
              : "border-bone-300 text-ink-600 hover:border-oxblood-500 hover:text-oxblood-500"
          }`}
        >
          All
        </button>
        {cats.map((c) => (
          <button
            key={c}
            data-testid={`cat-${c}`}
            onClick={() => setCategory(c)}
            className={`font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-2 border transition-colors ${
              category === c
                ? "border-oxblood-500 text-oxblood-500 bg-oxblood-50"
                : "border-bone-300 text-ink-600 hover:border-oxblood-500 hover:text-oxblood-500"
            }`}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="cap-mono">Sort:</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              data-testid={`sort-${s.id}`}
              onClick={() => setSort(s.id)}
              className={`font-mono text-[10px] uppercase tracking-[0.22em] px-2 py-1 transition-colors ${
                sort === s.id ? "text-oxblood-500 font-bold" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {(search || featuredFilter) && (
        <div className="cap-mono mt-6">
          {featuredFilter ? "// Filter: Curator's Picks" : `// Search: "${search}"`}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="cap-mono">// Loading shelf...</div>
        ) : sorted.length === 0 ? (
          <div data-testid="shop-empty" className="cap-mono col-span-full py-20 text-center">
            // No bottles match your filters
          </div>
        ) : (
          sorted.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}
