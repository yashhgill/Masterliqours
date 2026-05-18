import React, { useState } from "react";

const STORAGE_KEY = "ml_age_verified_v1";

function calcAge(dobIso) {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export default function AgeGate({ onVerified }) {
  const [verified, setVerified] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [dd, setDd] = useState("");
  const [mm, setMm] = useState("");
  const [yyyy, setYyyy] = useState("");
  const [error, setError] = useState("");

  if (verified) return null;

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const D = parseInt(dd, 10), M = parseInt(mm, 10), Y = parseInt(yyyy, 10);
    if (!D || !M || !Y || D > 31 || M > 12 || Y < 1900) {
      setError("Please enter a valid date.");
      return;
    }
    const iso = `${Y}-${String(M).padStart(2, "0")}-${String(D).padStart(2, "0")}`;
    const age = calcAge(iso);
    if (age < 0) { setError("Please enter a valid date."); return; }
    if (age < 21) { setError("Sorry — you must be 21 or above to enter."); return; }
    localStorage.setItem(STORAGE_KEY, "true");
    setVerified(true);
    onVerified?.();
  };

  return (
    <div
      data-testid="age-gate-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-bone-50/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg bg-white border border-bone-300 p-10 shadow-[0_30px_80px_-20px_rgba(168,35,28,0.25)]" data-testid="age-gate-modal">
        <div className="flex items-center justify-between mb-6">
          <span className="eyebrow">// Secure Entry</span>
          <div className="wax-seal text-base">M</div>
        </div>

        <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight leading-[0.95] text-ink-900">
          Are you <em className="not-italic text-oxblood-500 neon-glow-pink">21</em> or above?
        </h2>
        <div className="dual-lang mt-3 text-sm">
          <span className="han">您是否已满二十一岁？</span>
          <span className="text-bone-400">·</span>
          <span className="ta">21 அல்லது அதற்கு மேற்பட்டவரா?</span>
        </div>

        <p className="font-body font-light text-ink-500 mt-5 leading-relaxed text-sm sm:text-base">
          MASTER LIQUORS is for grown-ups, lah. By entering you confirm you are
          of legal drinking age in Malaysia. We&apos;ll check ID on delivery —
          no shortcuts.
        </p>

        <form onSubmit={submit} className="space-y-5 mt-8">
          <div>
            <span className="label-paper">Date of Birth</span>
            <div className="grid grid-cols-3 gap-3">
              <input data-testid="age-gate-dd" value={dd} onChange={(e) => setDd(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="DD" className="input-paper text-center" inputMode="numeric" />
              <input data-testid="age-gate-mm" value={mm} onChange={(e) => setMm(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="MM" className="input-paper text-center" inputMode="numeric" />
              <input data-testid="age-gate-yyyy" value={yyyy} onChange={(e) => setYyyy(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" className="input-paper text-center" inputMode="numeric" />
            </div>
          </div>

          {error && (
            <div data-testid="age-gate-error" className="font-mono text-xs text-oxblood-600">
              {error}
            </div>
          )}

          <button data-testid="age-gate-submit" type="submit" className="btn-oxblood w-full justify-center">
            Step Inside →
          </button>
          <a href="https://www.google.com" className="block text-center cap-mono hover:text-oxblood-500" data-testid="age-gate-exit">
            // I&apos;m under 21
          </a>
        </form>
      </div>
    </div>
  );
}
