import { useState } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError("Pogrešan email ili lozinka."); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      onLogin({ ...data.user, profile });
    } catch {
      setError("Greška pri povezivanju.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-text">Додеровићи</div>
      <div className="login-card">
        <div className="login-logo">
          <img src="/image/grb.png" alt="" className="login-grb" />
          <div className="login-title">Додеровићи</div>
          <div className="login-family">Пољана</div>
          <div className="login-subtitle">Систем за управљање родословом</div>
        </div>
        <div className="divider" />
        {error && <div className="login-error">{error}</div>}
        <div className="field-group">
          <label className="field-label">Email</label>
          <div className="field-wrapper">
            <span className="field-icon"><Icon name="mail" size={14} /></span>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="vas@email.com"
            />
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Lozinka</label>
          <div className="field-wrapper">
            <span className="field-icon"><Icon name="lock" size={14} /></span>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="lozinka"
            />
          </div>
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <><Icon name="spinner" size={16} />Prijava...</> : "Prijavite se →"}
        </button>
      </div>
    </div>
  );
}
