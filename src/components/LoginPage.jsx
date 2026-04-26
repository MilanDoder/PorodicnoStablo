import { FAMILY_NAME_PLURAL, FAMILY_BRANCH, FAMILY_FULL_NAME, APP_SUBTITLE } from "../config";
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
      if (authError) { setError("Погрешан имејл или лозинка."); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      onLogin({ ...data.user, profile });
    } catch {
      setError("Грешка при повезивању.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <svg className="login-wm-top" viewBox="0 0 1000 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="arcTop" d="M 0,180 Q 500,20 1000,180" />
        </defs>
        <text fontFamily="Cormorant Garamond, serif" fontSize="200" fontWeight="700" fill="rgba(200,150,62,0.08)" letterSpacing="2">
          <textPath href="#arcTop" startOffset="50%" textAnchor="middle">{FAMILY_NAME_PLURAL}</textPath>
        </text>
      </svg>
      <div className="login-card">
        <div className="login-logo">
          <img src="/image/grb.png" alt="Грб породице" className="login-grb" />
          <div className="login-title">{FAMILY_FULL_NAME}</div>
          <div className="login-subtitle">{APP_SUBTITLE}</div>
        </div>
        <div className="divider" />
        {error && <div className="login-error">{error}</div>}
        <div className="field-group">
          <label className="field-label">Eмаил</label>
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
          <label className="field-label">Лозинка</label>
          <div className="field-wrapper">
            <span className="field-icon"><Icon name="lock" size={14} /></span>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="лозинка"
            />
          </div>
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <><Icon name="spinner" size={16} />Пријава...</> : "Пријавите се →"}
        </button>
      </div>
      <svg className="login-wm-bot" viewBox="0 0 1000 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="arcBot" d="M 0,40 Q 500,200 1000,40" />
        </defs>
        <text fontFamily="Cormorant Garamond, serif" fontSize="200" fontWeight="700" fill="rgba(200,150,62,0.08)" letterSpacing="2">
          <textPath href="#arcBot" startOffset="50%" textAnchor="middle">{FAMILY_BRANCH}</textPath>
        </text>
      </svg>
    </div>
  );
}
