import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await login(email.trim().toLowerCase(), password);
    setBusy(false);
    if (r.ok) navigate("/admin");
    else setErr(r.error || "Login failed");
  };

  return (
    <div data-testid="admin-login-page" className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border-2 border-oxblood-500/40 p-10 paper relative shadow-[0_30px_80px_-20px_rgba(168,35,28,0.25)]">
        <div className="wax-seal absolute -top-6 -right-6" style={{ width: 70, height: 70, fontSize: "1.4rem" }}>M</div>
        <span className="eyebrow">// Control Room</span>
        <h1 className="font-display font-black text-4xl mt-4 tracking-tight text-ink-900">
          Admin <em className="italic text-oxblood-500">Login.</em>
        </h1>
        <p className="font-body text-ink-500 text-sm mt-2">
          Authorised personnel only. <em className="italic">Jangan main-main.</em>
        </p>

        <form onSubmit={submit} className="space-y-5 mt-8">
          <div>
            <span className="label-paper">Email</span>
            <input
              data-testid="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-paper"
              required
            />
          </div>
          <div>
            <span className="label-paper">Password</span>
            <input
              data-testid="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-paper"
              required
            />
          </div>
          {err && (
            <div data-testid="admin-login-error" className="font-mono text-xs text-oxblood-600">
              // {err}
            </div>
          )}
          <button data-testid="admin-login-submit" type="submit" disabled={busy} className="btn-oxblood w-full justify-center">
            {busy ? "Authenticating..." : "Login →"}
          </button>
        </form>
      </div>
    </div>
  );
}
