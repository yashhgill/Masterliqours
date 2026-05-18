import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import { Sparkles, Truck, MessageCircle, ShieldCheck, Gift, Wine } from "lucide-react";

const HERO_BG =
  "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1800&q=80";
// fallback to existing asset if unsplash fails
const HERO_BG_FALLBACK =
  "https://static.prod-images.emergentagent.com/jobs/172c0a50-3887-4fa6-ac66-7074571ca4ea/images/9b21d3e8d1075867facd0f82fe99e8bff90c1cfa7771c11846cd2fa636718174.png";

const BRANDS = [
  "Macallan", "Hennessy", "Patron", "Johnnie Walker",
  "Moet & Chandon", "Hendrick's", "Don Julio", "Bacardi",
  "Tanqueray", "Heineken", "Smirnoff", "Jack Daniel's",
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [heroImg, setHeroImg] = useState(HERO_BG);

  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then((r) => setFeatured(r.data));
  }, []);

  return (
    <div data-testid="home-page" className="relative">
      {/* HERO */}
      <section className="relative min-h-[88vh] grid lg:grid-cols-12 overflow-hidden border-b border-bone-300">
        {/* left content */}
        <div className="lg:col-span-7 px-6 sm:px-12 lg:px-20 pt-16 lg:pt-24 pb-12 flex flex-col justify-center relative z-10">
          <span className="eyebrow">// EST. 2026 · KUALA LUMPUR</span>

          <h1 className="font-display font-black tracking-[-0.02em] leading-[0.9] text-5xl sm:text-6xl lg:text-[5.5rem] mt-6 text-ink-900">
            <span className="block">Bottoms <em className="not-italic text-oxblood-500 neon-glow-pink">up,</em></span>
            <span className="block font-display italic">Bossku.</span>
          </h1>

          <div className="dual-lang mt-5 text-base">
            <span className="han">干杯 · </span>
            <span className="text-ink-700">Premium pours, delivered to your door.</span>
          </div>

          <p className="font-body font-light text-ink-600 max-w-xl mt-6 leading-relaxed text-base sm:text-lg">
            A neighbourhood liquor concierge for Kuala Lumpur — curated whisky,
            cognac, gin and festive bottles for Indian & Chinese households.
            Pay via bank transfer, finalise on WhatsApp. <em className="font-display italic text-oxblood-500">Easy peasy.</em>
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <Link to="/shop" data-testid="hero-shop-btn" className="btn-oxblood">
              Browse the Cellar →
            </Link>
            <Link to="/shop?featured=true" className="btn-gold-outline">
              <Gift className="w-4 h-4" /> Festive Gifting
            </Link>
          </div>

          {/* trust strip */}
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 items-center">
            <span className="cap-mono">As trusted by</span>
            <span className="font-display italic text-ink-700">Auntie Mei</span>
            <span className="text-gold-500">✦</span>
            <span className="font-display italic text-ink-700">Cousin Raj</span>
            <span className="text-gold-500">✦</span>
            <span className="font-display italic text-ink-700">that one cool Pakcik</span>
          </div>
        </div>

        {/* right image */}
        <div className="lg:col-span-5 relative min-h-[400px] lg:min-h-full">
          <img
            src={heroImg}
            onError={() => setHeroImg(HERO_BG_FALLBACK)}
            alt="Premium liquor display"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-bone-50/60 lg:to-bone-50/40" />
          <div className="absolute top-6 right-6 wax-seal" style={{ width: 84, height: 84, fontSize: "1.7rem" }}>M</div>
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm border border-gold-500/60 px-4 py-3 shadow-lg">
            <div className="cap-mono !text-[9px] !tracking-[0.3em]">This Week's Pour</div>
            <div className="font-display font-bold text-base text-ink-900">Macallan 12 Double Cask</div>
            <div className="font-mono text-sm text-oxblood-500 mt-0.5">RM 549.00</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-bone-300 bg-ink-900 text-bone-50 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-5 font-display font-black text-2xl tracking-tight">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
              <span className="text-gold-500">CHEERS LA, LAH</span>
              <span className="text-bone-300">●</span>
              <span className="font-han">名酒珍藏</span>
              <span className="text-bone-300">●</span>
              <span className="text-oxblood-400">PREMIUM POURS</span>
              <span className="text-bone-300">●</span>
              <span>KL DELIVERY · 60 MIN</span>
              <span className="text-bone-300">●</span>
              <span className="text-gold-500">FREE OVER RM300</span>
              <span className="text-bone-300">●</span>
              <span>BANK + WHATSAPP</span>
              <span className="text-bone-300">●</span>
              <span className="font-han">恭喜发财</span>
              <span className="text-bone-300">●</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { Icon: Sparkles, t: "Curated Selection", d: "Hand-picked bottles. No mass-market filler.", c: "oxblood" },
          { Icon: ShieldCheck, t: "21+ Verified", d: "Strict ID check on every delivery. No skipping.", c: "ink" },
          { Icon: Truck, t: "Discreet Drop", d: "Unbranded boxes. Same-day across Klang Valley.", c: "gold" },
          { Icon: MessageCircle, t: "WhatsApp Native", d: "Chat with an actual human. No bots.", c: "neon" },
        ].map(({ Icon, t, d, c }) => (
          <div key={t} className="paper p-7 border border-bone-300 relative">
            <Icon className={`w-7 h-7 ${
              c === "oxblood" ? "text-oxblood-500" :
              c === "gold" ? "text-gold-600" :
              c === "neon" ? "text-neon-pink" : "text-ink-900"
            }`} />
            <h3 className="font-display font-bold text-lg mt-4 text-ink-900">{t}</h3>
            <p className="font-body text-ink-600 text-sm mt-2 leading-relaxed">{d}</p>
          </div>
        ))}
      </section>

      {/* FESTIVE GIFTING BAND */}
      <section className="relative overflow-hidden border-y border-bone-300">
        <div className="absolute inset-0 bg-gradient-to-r from-oxblood-700 via-oxblood-500 to-oxblood-700" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(201,162,74,0.45) 18px, rgba(201,162,74,0.45) 19px)"
        }} />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold-100">
              ✦ FESTIVE GIFTING · 节日礼品 · பண்டிகை பரிசு ✦
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl mt-4 text-bone-50 leading-[1.05]">
              For <em className="italic">Chinese New Year,</em><br />
              <em className="italic">Deepavali,</em> & every party in between.
            </h2>
            <p className="font-body text-bone-100 mt-5 max-w-lg leading-relaxed">
              Pre-wrapped gift boxes in red & gold. Curated whisky duos,
              champagne flutes, festive hampers — delivered in time for the
              reunion dinner or family gathering.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop?featured=true" className="btn-gold-outline !border-gold-500 !text-gold-100 hover:!bg-gold-500 hover:!text-ink-900">
                Shop Gift Boxes →
              </Link>
              <a href="https://wa.me/60123456789?text=Hi%20Mr%20Chow%2C%20I%27d%20like%20to%20discuss%20bulk%2Fcorporate%20gifting." target="_blank" rel="noreferrer" className="font-mono text-xs uppercase tracking-[0.25em] text-bone-100 hover:text-gold-500 flex items-center gap-2 self-center">
                <MessageCircle className="w-3.5 h-3.5" /> Bulk / Corporate →
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { tag: "新年", label: "CNY Whisky Duo", price: "RM 768" },
              { tag: "தீபம்", label: "Deepavali Hamper", price: "RM 588" },
              { tag: "囍", label: "Wedding Bundle", price: "RM 1,288" },
            ].map((g, i) => (
              <div key={g.label} className="bg-bone-50 border border-gold-500 p-4 paper relative" style={{ transform: `rotate(${i % 2 === 0 ? "-2deg" : "1.5deg"})` }}>
                <div className="wax-seal absolute -top-4 -right-3" style={{ width: 42, height: 42, fontSize: "0.95rem" }}>{g.tag}</div>
                <Wine className="w-7 h-7 text-oxblood-500 mt-2" />
                <div className="font-display font-bold text-sm text-ink-900 mt-3 leading-tight">{g.label}</div>
                <div className="font-mono text-xs text-oxblood-500 mt-1">{g.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-24">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="eyebrow">// Curator's Shelf</span>
            <h2 className="font-display font-black text-4xl sm:text-6xl mt-4 text-ink-900 tracking-tight">
              The <em className="italic text-oxblood-500">Good</em> Stuff.
            </h2>
            <p className="font-body text-ink-500 max-w-md mt-3">
              The bottles we'd actually pour for our own family at a dinner party.
            </p>
          </div>
          <Link to="/shop" data-testid="featured-view-all" className="btn-ink-ghost">
            View All →
          </Link>
        </div>
        <div data-testid="featured-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* BRAND MARQUEE */}
      <section className="border-y border-bone-300 bg-bone-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="cap-mono text-center !text-[10px] !tracking-[0.35em] mb-3">// Distillers we carry</div>
        </div>
        <div className="flex animate-marquee whitespace-nowrap py-3 font-display italic text-2xl text-ink-700">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-10 pr-10">
              {BRANDS.map((b) => (
                <span key={b + i} className="flex items-center gap-10">
                  {b}
                  <span className="text-gold-500 text-xs">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative bg-ink-900 text-bone-50 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-oxblood-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-12 py-24 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold-500">// Direct Line</span>
          <h2 className="font-display font-black text-4xl sm:text-6xl mt-5 tracking-tight leading-[1.05]">
            Can't decide? <em className="italic text-oxblood-400 neon-glow-pink">Just chat.</em>
          </h2>
          <p className="font-body text-bone-300 max-w-xl mx-auto mt-6 leading-relaxed">
            Looking for something rare, a CNY hamper, or a Deepavali surprise
            for your boss? Hit us on WhatsApp — we keep a back-room book.
          </p>
          <div className="mt-10 flex justify-center">
            <a
              href="https://wa.me/60123456789?text=Hi%20Mr%20Chow%2C%20I%27d%20like%20a%20recommendation."
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
              data-testid="home-cta-whatsapp"
            >
              <MessageCircle className="w-5 h-5" /> Start a Conversation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
