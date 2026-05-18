import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Search } from "lucide-react";
import { useCart } from "../lib/cart";

export default function Navbar() {
  const { totals } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
  };

  const linkClass = ({ isActive }) =>
    `font-mono text-[11px] uppercase tracking-[0.25em] transition-colors ${
      isActive ? "text-oxblood-500" : "text-ink-600 hover:text-oxblood-500"
    }`;

  return (
    <>
      {/* Top auspicious strip */}
      <div className="bg-ink-900 text-bone-50 text-[10px] font-mono uppercase tracking-[0.35em] py-2 px-4 text-center">
        <span className="text-gold-500">✦</span>
        <span className="mx-3">FREE KL DELIVERY · ORDERS RM300+</span>
        <span className="text-gold-500">✦</span>
        <span className="mx-3 font-han text-[12px] tracking-normal">免费配送</span>
        <span className="text-gold-500">✦</span>
        <span className="mx-3">21+ ONLY · DRINK RESPONSIBLY</span>
        <span className="text-gold-500">✦</span>
      </div>

      <header
        data-testid="navbar"
        className="sticky top-0 z-40 border-b border-bone-300 bg-bone-50/90 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-6">
          <Link to="/" data-testid="navbar-logo" className="flex items-center gap-3 group">
            <span className="wax-seal !w-9 !h-9 !text-sm">M</span>
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-ink-900 leading-none">
              Master<span className="text-oxblood-500">.</span>Liquors
              <span className="block font-han text-[10px] tracking-[0.4em] text-ink-500 mt-1">名酒・MASTER · 21+</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 ml-8">
            <NavLink to="/" end className={linkClass} data-testid="nav-home">Home</NavLink>
            <NavLink to="/shop" className={linkClass} data-testid="nav-shop">Shop</NavLink>
            <NavLink to="/shop?category=Whisky" className={linkClass} data-testid="nav-whisky">Whisky</NavLink>
            <NavLink to="/shop?category=Gin" className={linkClass} data-testid="nav-gin">Gin</NavLink>
            <NavLink to="/shop?category=Champagne" className={linkClass} data-testid="nav-champ">Champagne</NavLink>
            <NavLink to="/shop?featured=true" className={linkClass} data-testid="nav-festive">Festive Gifting</NavLink>
          </nav>

          <form onSubmit={onSearch} className="hidden lg:flex items-center gap-2 ml-auto border-b border-bone-300 focus-within:border-oxblood-500 transition-colors">
            <Search className="w-4 h-4 text-ink-400" />
            <input
              data-testid="navbar-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search bottles, brands..."
              className="bg-transparent outline-none text-sm font-mono py-2 w-56 placeholder:text-ink-400"
            />
          </form>

          <Link
            to="/cart"
            data-testid="navbar-cart"
            className="ml-auto lg:ml-0 relative flex items-center gap-2 px-4 py-2 border border-bone-300 hover:border-oxblood-500 hover:text-oxblood-500 transition-colors bg-white"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-widest">Cart</span>
            {totals.count > 0 && (
              <span
                data-testid="navbar-cart-count"
                className="absolute -top-2 -right-2 bg-oxblood-500 text-bone-50 text-[10px] font-mono font-bold px-1.5 py-0.5"
                style={{ boxShadow: "0 0 12px rgba(255,16,122,0.55)" }}
              >
                {totals.count}
              </span>
            )}
          </Link>
        </div>
      </header>
    </>
  );
}
