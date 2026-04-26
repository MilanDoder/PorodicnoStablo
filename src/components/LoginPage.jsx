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
      if (authError) { setError("Погрешан емаил или лозинка."); return; }
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
      <svg className="login-bg-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="arcTop" d="M 50,320 Q 600,60 1150,320" />
          <path id="arcBot" d="M 50,480 Q 600,740 1150,480" />
        </defs>
        <text fontFamily="Cormorant Garamond, serif" fontSize="105" fontWeight="700" fill="rgba(200,150,62,0.09)" letterSpacing="8">
          <textPath href="#arcTop" startOffset="50%" textAnchor="middle">Додеровићи</textPath>
        </text>
        <text fontFamily="Cormorant Garamond, serif" fontSize="105" fontWeight="700" fill="rgba(200,150,62,0.09)" letterSpacing="8">
          <textPath href="#arcBot" startOffset="50%" textAnchor="middle">Додери</textPath>
        </text>
      </svg>
      <div className="login-card">
        <div className="login-logo">
          <img src="/image/grb.png" alt="Грб породице" className="login-grb" />
          <div className="login-title">Додеровићи и Додери</div>
          <div className="login-subtitle">Систем за управљање родословом</div>
        </div>
        <div className="divider" />
        {error && <div className="login-error">{error}</div>}
        <div className="field-group">
          <label className="field-label">Емаил</label>
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
              placeholder="lozinka"
            />
          </div>
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <><Icon name="spinner" size={16} />Пријава...</> : "Пријавите се →"}
        </button>
      </div>
    </div>
  );
}
