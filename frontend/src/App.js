import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { CartProvider } from "./lib/cart";
import { AuthProvider } from "./lib/auth";
import AgeGate from "./components/AgeGate";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function Footer() {
  return (
    <footer className="border-t border-bone-300 mt-24 bg-ink-900 text-bone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="wax-seal !w-12 !h-12 !text-base">M</span>
            <div className="font-display font-black text-2xl tracking-tight">
              Master<span className="text-oxblood-400">.</span>Liquors
            </div>
          </div>
          <div className="dual-lang mt-3 text-sm" style={{ color: "#FAF1DC" }}>
            <span className="han">名酒珍藏</span>
            <span className="text-gold-500">·</span>
            <span style={{ fontFamily: "Outfit", color: "#FAF1DC" }}>தரமான மது</span>
          </div>
          <p className="font-body text-bone-300 mt-5 max-w-sm leading-relaxed">
            A neighbourhood liquor concierge in Kuala Lumpur. Curated whisky,
            cognac, gin & festive bottles, delivered with care to your door.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-500 mb-3">// Navigate</div>
          <ul className="space-y-2.5 font-body text-sm text-bone-300">
            <li><a href="/shop" className="hover:text-gold-500">Shop</a></li>
            <li><a href="/shop?featured=true" className="hover:text-gold-500">Festive Gifting</a></li>
            <li><a href="/cart" className="hover:text-gold-500">Cart</a></li>
            <li><a href="/admin/login" className="hover:text-gold-500">Admin</a></li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-500 mb-3">// Drink Responsibly</div>
          <p className="font-mono text-[11px] text-bone-300 leading-relaxed">
            21+ ONLY.<br />
            ID required on delivery.<br />
            Excessive consumption is harmful to your health.
          </p>
        </div>
      </div>
      <div className="border-t border-ink-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-bone-400">
          <span>© 2026 Master Liquors · KL</span>
          <span className="font-han text-[11px] tracking-normal">恭喜发财 · वर्ष शुभ हो</span>
          <span>masterliqours.my</span>
        </div>
      </div>
    </footer>
  );
}

function Shell({ children }) {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <AgeGate />}
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Shell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Shell>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
