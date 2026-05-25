import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LogOut, Plus, Edit3, Trash2, X, CloudUpload } from "lucide-react";

export default function AdminDashboard() {
  const { user, checking, logout } = useAuth();
  const [tab, setTab] = useState("inventory");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [sheetResult, setSheetResult] = useState(null);

  const refresh = async () => {
    const [s, p, o] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/products"),
      api.get("/orders"),
    ]);
    setStats(s.data);
    setProducts(p.data);
    setOrders(o.data);
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const syncGoogleSheets = async () => {
    setSyncingSheets(true);
    setSheetResult(null);
    try {
      const { data } = await api.post("/google/sheets/sync");
      setSheetResult(data);
    } catch (err) {
      setSheetResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setSyncingSheets(false);
    }
  };

  if (checking) return <div className="p-20 cap-mono">// AUTHENTICATING...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div data-testid="admin-dashboard" className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-bone-300 pb-6">
        <div>
          <span className="eyebrow">// Control Room</span>
          <h1 className="font-display font-black text-4xl sm:text-5xl mt-3 tracking-tight text-ink-900">
            Dashboard.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="cap-mono">{user.email}</span>
          <button
            type="button"
            onClick={syncGoogleSheets}
            disabled={syncingSheets}
            className="btn-ink-ghost flex items-center gap-2"
          >
            <CloudUpload className="w-3 h-3" /> {syncingSheets ? "Syncing..." : "Sync Sheets"}
          </button>
          <button data-testid="admin-logout" onClick={logout} className="btn-ink-ghost flex items-center gap-2">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </div>

      {sheetResult && (
        <div className={`mt-6 border p-4 font-mono text-xs ${sheetResult.success ? "border-gold-500 text-ink-700 bg-gold-500/10" : "border-oxblood-500 text-oxblood-600 bg-oxblood-500/10"}`}>
          {sheetResult.success ? (
            <span>
              Google Sheets synced: {sheetResult.inventoryRows} inventory rows, {sheetResult.orderRows} order rows.{" "}
              <a className="underline" href={sheetResult.spreadsheetUrl} target="_blank" rel="noreferrer">Open sheet</a>
            </span>
          ) : (
            <span>{sheetResult.error}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-8">
        <Stat label="PRODUCTS" value={stats?.total_products ?? "—"} color="ink" />
        <Stat label="LOW STOCK" value={stats?.low_stock ?? "—"} color="oxblood" />
        <Stat label="ORDERS" value={stats?.total_orders ?? "—"} color="gold" />
        <Stat label="PENDING" value={stats?.pending_orders ?? "—"} color="oxblood" />
        <Stat label="REVENUE" value={stats ? `RM${stats.revenue.toFixed(0)}` : "—"} color="gold" />
      </div>

      <div className="mt-10 flex gap-1 border-b border-bone-300">
        {["inventory", "orders"].map((t) => (
          <button
            key={t}
            data-testid={`admin-tab-${t}`}
            onClick={() => setTab(t)}
            className={`font-mono text-xs uppercase tracking-[0.25em] px-4 py-3 border-b-2 -mb-px ${
              tab === t ? "border-oxblood-500 text-oxblood-500" : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "inventory" && (
        <InventoryPanel
          products={products}
          onCreate={() => setEditing({})}
          onEdit={(p) => setEditing(p)}
          onDelete={async (p) => {
            if (!confirm(`Delete ${p.name}?`)) return;
            await api.delete(`/products/${p.id}`);
            refresh();
          }}
        />
      )}
      {tab === "orders" && <OrdersPanel orders={orders} refresh={refresh} />}

      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  const cls = {
    oxblood: "text-oxblood-500 neon-glow-pink",
    gold: "text-gold-600",
    ink: "text-ink-900",
  }[color];
  return (
    <div className="border border-bone-300 bg-white p-5">
      <div className="cap-mono">{label}</div>
      <div className={`font-mono font-bold text-3xl mt-1 ${cls}`}>{value}</div>
    </div>
  );
}

function InventoryPanel({ products, onCreate, onEdit, onDelete }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="cap-mono">{products.length} bottles</div>
        <button data-testid="admin-add-product" onClick={onCreate} className="btn-oxblood !py-2.5 !text-sm flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>
      <div className="overflow-x-auto border border-bone-300 bg-white">
        <table className="w-full font-mono text-xs">
          <thead className="bg-bone-100 text-ink-500 uppercase tracking-widest">
            <tr>
              <th className="text-left p-3">NAME</th>
              <th className="text-left p-3">CATEGORY</th>
              <th className="text-right p-3">PRICE</th>
              <th className="text-right p-3">STOCK</th>
              <th className="text-right p-3 w-32">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-bone-200 hover:bg-bone-100/50">
                <td className="p-3">
                  <div className="text-ink-900 font-bold">{p.name}</div>
                  <div className="text-ink-500">{p.brand}</div>
                </td>
                <td className="p-3 text-ink-600">{p.category}</td>
                <td className="p-3 text-right text-oxblood-500 font-bold">RM{p.price_myr.toFixed(2)}</td>
                <td className={`p-3 text-right font-bold ${p.stock < 5 ? "text-oxblood-500" : "text-ink-900"}`}>{p.stock}</td>
                <td className="p-3 text-right">
                  <button
                    data-testid={`edit-product-${p.id}`}
                    onClick={() => onEdit(p)}
                    className="text-ink-500 hover:text-oxblood-500 p-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`delete-product-${p.id}`}
                    onClick={() => onDelete(p)}
                    className="text-ink-500 hover:text-oxblood-500 p-1.5 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersPanel({ orders, refresh }) {
  const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
  return (
    <div className="mt-8 overflow-x-auto border border-bone-300 bg-white">
      <table className="w-full font-mono text-xs">
        <thead className="bg-bone-100 text-ink-500 uppercase tracking-widest">
          <tr>
            <th className="text-left p-3">ORDER</th>
            <th className="text-left p-3">CUSTOMER</th>
            <th className="text-left p-3">ITEMS</th>
            <th className="text-right p-3">TOTAL</th>
            <th className="text-left p-3">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr><td colSpan={5} className="p-8 text-center cap-mono">// NO ORDERS YET</td></tr>
          ) : orders.map((o) => (
            <tr key={o.id} className="border-t border-bone-200 align-top">
              <td className="p-3">
                <div className="text-ink-900 font-bold">{o.order_number}</div>
                <div className="text-ink-500 text-[10px]">{new Date(o.created_at).toLocaleString()}</div>
              </td>
              <td className="p-3">
                <div className="text-ink-900 font-bold">{o.customer_name}</div>
                <div className="text-ink-500">{o.phone}</div>
                <div className="text-ink-400 text-[10px] max-w-[200px] truncate">{o.address}</div>
              </td>
              <td className="p-3 text-ink-600">
                {o.items.map((i) => (
                  <div key={i.product_id}>{i.quantity}× {i.name}</div>
                ))}
              </td>
              <td className="p-3 text-right text-oxblood-500 font-bold">RM{o.total.toFixed(2)}</td>
              <td className="p-3">
                <select
                  data-testid={`order-status-${o.id}`}
                  value={o.status}
                  onChange={async (e) => {
                    await api.patch(`/orders/${o.id}/status`, { status: e.target.value });
                    refresh();
                  }}
                  className="bg-bone-50 border border-bone-300 text-ink-900 p-2 font-mono text-xs uppercase"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductEditor({ product, onClose, onSaved }) {
  const isNew = !product.id;
  const [f, setF] = useState({
    name: product.name || "",
    brand: product.brand || "",
    category: product.category || "Whisky",
    abv: product.abv ?? 40,
    volume_ml: product.volume_ml ?? 750,
    price_myr: product.price_myr ?? 0,
    stock: product.stock ?? 0,
    image_url: product.image_url || "",
    description: product.description || "",
    featured: !!product.featured,
    origin: product.origin || "",
  });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isNew) await api.post("/products", f);
      else await api.put(`/products/${product.id}`, f);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink-900/40 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border-2 border-oxblood-500/40 p-7 max-h-[90vh] overflow-y-auto shadow-2xl"
        data-testid="product-editor"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="eyebrow">// {isNew ? "New Product" : "Edit Product"}</span>
            <h2 className="font-display font-black text-2xl tracking-tight mt-2 text-ink-900">
              {isNew ? "Add Bottle" : f.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-ink-500 hover:text-oxblood-500"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Editor label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} testId="pe-name" />
          <Editor label="Brand" value={f.brand} onChange={(v) => setF({ ...f, brand: v })} testId="pe-brand" />
          <Editor label="Category" value={f.category} onChange={(v) => setF({ ...f, category: v })} testId="pe-category" />
          <Editor label="Origin" value={f.origin} onChange={(v) => setF({ ...f, origin: v })} testId="pe-origin" />
          <Editor label="ABV %" type="number" value={f.abv} onChange={(v) => setF({ ...f, abv: parseFloat(v || 0) })} testId="pe-abv" />
          <Editor label="Volume (ml)" type="number" value={f.volume_ml} onChange={(v) => setF({ ...f, volume_ml: parseInt(v || 0) })} testId="pe-volume" />
          <Editor label="Price (MYR)" type="number" step="0.01" value={f.price_myr} onChange={(v) => setF({ ...f, price_myr: parseFloat(v || 0) })} testId="pe-price" />
          <Editor label="Stock" type="number" value={f.stock} onChange={(v) => setF({ ...f, stock: parseInt(v || 0) })} testId="pe-stock" />
          <div className="col-span-2">
            <Editor label="Image URL" value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} testId="pe-image" />
          </div>
          <div className="col-span-2">
            <span className="label-paper">Description</span>
            <textarea
              data-testid="pe-description"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              rows={3}
              className="input-paper resize-none"
            />
          </div>
          <label className="col-span-2 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-ink-600 cursor-pointer">
            <input
              data-testid="pe-featured"
              type="checkbox"
              checked={f.featured}
              onChange={(e) => setF({ ...f, featured: e.target.checked })}
              className="w-4 h-4 accent-oxblood-500"
            />
            Featured on homepage (Curator's Pick)
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="btn-ink-ghost flex-1">Cancel</button>
          <button data-testid="pe-save" type="submit" disabled={busy} className="btn-oxblood flex-1 justify-center">
            {busy ? "Saving..." : "Save Bottle"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Editor({ label, value, onChange, testId, ...rest }) {
  return (
    <div>
      <span className="label-paper">{label}</span>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-paper"
        {...rest}
      />
    </div>
  );
}
