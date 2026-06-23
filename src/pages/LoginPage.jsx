// src/pages/LoginPage.jsx
import { useState, useEffect, useRef } from "react";
import skyupLogo from "../assets/image2.png";

const API_BASE = "";

const LOGIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Inter',sans-serif}

@keyframes floatA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-30px) scale(1.05)}}
@keyframes floatB{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-18px,22px) scale(1.04)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{
  0%,100%{box-shadow:0 0 0 0 rgba(180,60,40,0.3),0 8px 40px rgba(0,0,0,0.15)}
  50%{box-shadow:0 0 0 10px rgba(180,60,40,0),0 8px 40px rgba(0,0,0,0.15)}
}
@keyframes logoPop{0%{transform:scale(.75);opacity:0}70%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
@keyframes fadeSlide{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}

.login-card{position:relative;overflow:hidden}
.login-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,#B43C28,#C8711A,#D4A017,#C8711A,#B43C28);
  background-size:200% auto;animation:shimmer 3s linear infinite;
}

.btn-primary{
  width:100%;height:52px;border:none;border-radius:10px;
  background:linear-gradient(135deg,#1E2A6E 0%,#2A3A8E 100%);
  color:#FAF7F2;font-family:'Inter',sans-serif;font-size:.9rem;font-weight:600;
  letter-spacing:.6px;text-transform:uppercase;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;
  box-shadow:0 4px 20px rgba(30,42,110,.35);
  transition:transform .18s,box-shadow .18s,opacity .18s;
  position:relative;overflow:hidden;
}
.btn-primary::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 60%);
}
.btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(30,42,110,.45)}
.btn-primary:active:not(:disabled){transform:translateY(0)}
.btn-primary:disabled{opacity:.6;cursor:not-allowed}

.btn-link{
  background:none;border:none;color:#B43C28;font-family:'Inter',sans-serif;
  font-size:.82rem;font-weight:600;cursor:pointer;padding:0;
  text-decoration:underline;text-underline-offset:3px;
}
.btn-link:hover{color:#8B2E1C}

.spinner{
  width:16px;height:16px;
  border:2px solid rgba(250,247,242,.35);border-top-color:#FAF7F2;
  border-radius:50%;animation:spin .7s linear infinite;display:inline-block;
}

.otp-inputs{display:flex;gap:10px;justify-content:center;margin:20px 0}
.otp-box{
  width:48px;height:56px;border:1.5px solid #D4C5B0;border-radius:10px;
  font-size:1.4rem;font-weight:700;text-align:center;
  font-family:'Inter',sans-serif;color:#1E2A6E;background:#FAF7F2;
  outline:none;transition:border-color .2s,box-shadow .2s,background .2s;
}
.otp-box:focus{border-color:#B43C28;background:#fff;box-shadow:0 0 0 3px rgba(180,60,40,.12)}
.step-anim{animation:fadeSlide .35s ease both}
`;

function useMouseGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);
  return ref;
}

function FloatingOrbs() {
  return (
    <div style={S.orbsWrap} aria-hidden>
      <div style={{ ...S.orb, ...S.orb1 }} />
      <div style={{ ...S.orb, ...S.orb2 }} />
    </div>
  );
}

function LogoHero() {
  return (
    <div style={S.logoHero}>
      <div style={S.logoRing}>
        <div style={S.logoGlow} />
        <img
          src={skyupLogo}
          alt="SAANGATYA Logo"
          style={S.logoImg}
        />
      </div>
      <div style={S.logoText}>
        <h1 style={S.brandTitle}>SAANGATYA</h1>
        <p style={S.brandSub}>Properties and Developers</p>
        <div style={S.brandDivider} />
        <p style={S.brandTagline}>Salary Slip Management</p>
      </div>
    </div>
  );
}

function AlertBox({ message, type = "error" }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      style={{
        ...S.alertBox,
        background: isSuccess ? "#F0FBF4" : "#FDF3F1",
        borderColor: isSuccess ? "#7BC99A" : "#E8A090",
        color: isSuccess ? "#1A6B3C" : "#8B2E1C",
      }}
      role="alert"
    >
      <span>{isSuccess ? "✅" : "⚠"}</span> {message}
    </div>
  );
}

function InputField({ label, type, value, onChange, placeholder, autoComplete, addon, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <div
        style={{
          ...S.inputWrap,
          borderColor: focused ? "#1E2A6E" : "#D4C5B0",
          background: focused ? "#fff" : "#FAF7F2",
          boxShadow: focused ? "0 0 0 3px rgba(30,42,110,0.1)" : "none",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={S.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
        />
        {addon && <span style={S.inputAddon}>{addon}</span>}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange }) {
  const digits = (value + "      ").slice(0, 6).split("");
  const inputsRef = useRef([]);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const newVal = value.slice(0, i) + value.slice(i + 1);
      onChange(newVal);
      if (i > 0) inputsRef.current[i - 1]?.focus();
      return;
    }
    if (/^\d$/.test(e.key)) {
      const newVal = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 6);
      onChange(newVal);
      if (i < 5) inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) onChange(pasted);
  };

  return (
    <div className="otp-inputs">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          className="otp-box"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

// ── Step 1: Login ─────────────────────────────────────────────────────────────
function LoginStep({ onForgotPassword }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Please enter both username and password."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Login failed. Please check your credentials."); return; }
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_info", JSON.stringify(data.admin));
      window.location.replace("/");
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-anim">
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Welcome Back</h2>
        <p style={S.cardSub}>Sign in to access the salary management portal</p>
      </div>
      <AlertBox message={error} />
      <form onSubmit={handleSubmit}>
        <InputField
          label="Username" type="text" value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username" autoComplete="username"
          addon={<span style={{ fontSize: "1rem", color: "#B4A090" }}>👤</span>}
        />
        <InputField
          label="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password"
        />
        <div style={{ textAlign: "left", marginTop: -10, marginBottom: 18 }}>
          <button type="button" className="btn-link" onClick={onForgotPassword}>
            Forgot Password?
          </button>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

// ── Step 2: Forgot Password ───────────────────────────────────────────────────
function ForgotEmailStep({ onOtpSent, onBack }) {
  const [ownerEmail, setOwnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!ownerEmail) { setError("Please enter the owner Gmail."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: ownerEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("OTP sent to owner Gmail! Check your inbox.");
        setTimeout(() => onOtpSent(ownerEmail.trim()), 1500);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-anim">
      <button onClick={onBack} style={S.backBtn}>← Back to Login</button>
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Forgot Password</h2>
        <p style={S.cardSub}>Enter the owner Gmail to receive a 6-digit OTP</p>
      </div>
      <AlertBox message={error} />
      <AlertBox message={success} type="success" />
      <form onSubmit={handleSend}>
        <InputField
          label="Owner Gmail" type="email" value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="Enter owner Gmail account" autoComplete="email"
          addon={<span style={{ fontSize: "1rem", color: "#B4A090" }}>🔐</span>}
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>
      </form>
    </div>
  );
}

// ── Step 3: OTP ───────────────────────────────────────────────────────────────
function OtpStep({ ownerEmail, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the full 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail, otp }),
      });
      const data = await res.json();
      if (data.success) {
        onVerified(data.resetToken);
      } else {
        setError(data.message || "Invalid OTP.");
        setOtp("");
      }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(""); setError(""); setOtp("");
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail }),
      });
      setResendMsg("A new OTP has been sent to the owner Gmail.");
      setResendCooldown(60);
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  return (
    <div className="step-anim">
      <button onClick={onBack} style={S.backBtn}>← Back</button>
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Enter OTP</h2>
        <p style={S.cardSub}>We sent a 6-digit code to <strong>{ownerEmail}</strong></p>
      </div>
      <AlertBox message={error} />
      <AlertBox message={resendMsg} type="success" />
      <form onSubmit={handleVerify}>
        <OtpInput value={otp} onChange={setOtp} />
        <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Verifying…" : "Verify OTP"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        {resendCooldown > 0 ? (
          <p style={{ fontSize: "0.8rem", color: "#9A8A7A" }}>Resend in {resendCooldown}s</p>
        ) : (
          <button className="btn-link" onClick={handleResend}>Resend OTP</button>
        )}
      </div>
    </div>
  );
}

// ── Step 4: New Password ──────────────────────────────────────────────────────
function NewPasswordStep({ resetToken, onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (data.success) { onDone(); }
      else { setError(data.message || "Failed to reset password."); }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-anim">
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Set New Password</h2>
        <p style={S.cardSub}>Choose a strong password for your account</p>
      </div>
      <AlertBox message={error} />
      <form onSubmit={handleReset}>
        <InputField
          label="New Password" type={showNew ? "text" : "password"} value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters" autoComplete="new-password"
          addon={
            <span onClick={() => setShowNew((v) => !v)}
              style={{ cursor: "pointer", fontSize: "1rem", color: "#B4A090", userSelect: "none" }}>
              {showNew ? "🙈" : "👁"}
            </span>
          }
        />
        <InputField
          label="Confirm Password" type={showConfirm ? "text" : "password"} value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password" autoComplete="new-password"
          addon={
            <span onClick={() => setShowConfirm((v) => !v)}
              style={{ cursor: "pointer", fontSize: "1rem", color: "#B4A090", userSelect: "none" }}>
              {showConfirm ? "🙈" : "👁"}
            </span>
          }
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

// ── Step 5: Success ───────────────────────────────────────────────────────────
function SuccessStep({ onLogin }) {
  return (
    <div className="step-anim" style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🎉</div>
      <h2 style={{ ...S.cardTitle, marginBottom: 8 }}>Password Reset!</h2>
      <p style={{ ...S.cardSub, marginBottom: 28 }}>
        Your password has been updated. You can now sign in.
      </p>
      <button className="btn-primary" onClick={onLogin}>Back to Sign In</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [step, setStep] = useState("login");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [entered, setEntered] = useState(false);
  const cardRef = useMouseGlow();

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LOGIN_CSS }} />
      <div style={S.root}>
        <FloatingOrbs />

        <div style={S.rightPanel}>
          <div style={{
            ...S.container,
            opacity: entered ? 1 : 0,
            transform: entered ? "none" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
            <div style={{
              ...S.logoWrap,
              animation: entered ? "logoPop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both" : "none",
            }}>
              <LogoHero />
            </div>

            <div ref={cardRef} className="login-card" style={S.card}>
              <div style={{ position: "relative", zIndex: 1 }}>
                {step === "login" && (
                  <LoginStep onForgotPassword={() => setStep("forgot-email")} />
                )}
                {step === "forgot-email" && (
                  <ForgotEmailStep
                    onOtpSent={(email) => { setOwnerEmail(email); setStep("otp"); }}
                    onBack={() => setStep("login")}
                  />
                )}
                {step === "otp" && (
                  <OtpStep
                    ownerEmail={ownerEmail}
                    onVerified={(token) => { setResetToken(token); setStep("new-password"); }}
                    onBack={() => setStep("forgot-email")}
                  />
                )}
                {step === "new-password" && (
                  <NewPasswordStep
                    resetToken={resetToken}
                    onDone={() => setStep("success")}
                  />
                )}
                {step === "success" && (
                  <SuccessStep onLogin={() => setStep("login")} />
                )}
              </div>
            </div>

            <p style={S.footer}>
              © {new Date().getFullYear()} SAANGATYA Properties and Developers. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif",
    background: "#FAF7F2", position: "relative", overflow: "hidden",
  },

  // Decorative left panel (hidden on mobile via inline media not possible in JS—
  // use a simple approach: show only on wider viewports via width)
  leftPanel: {
    flex: "0 0 38%", background: "linear-gradient(160deg,#1E2A6E 0%,#2C3A8E 40%,#1A1F5A 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
    "@media(max-width:768px)": { display: "none" },
  },
  leftPanelInner: { padding: "48px", textAlign: "center", zIndex: 1 },
  leftQuote: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600,
    color: "#FAF7F2", lineHeight: 1.4, marginBottom: 16, letterSpacing: "0.3px",
  },
  leftQuoteSub: { fontSize: "0.82rem", color: "rgba(250,247,242,0.5)", letterSpacing: "1px", textTransform: "uppercase" },

  // Floating orbs on the left panel
  orbsWrap: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 },
  orb: { position: "absolute", borderRadius: "50%", filter: "blur(60px)" },
  orb1: { width: 300, height: 300, background: "rgba(180,60,40,0.06)", top: "-60px", right: "-60px", animation: "floatA 10s ease-in-out infinite" },
  orb2: { width: 220, height: 220, background: "rgba(212,160,23,0.06)", bottom: "-40px", left: "-40px", animation: "floatB 13s ease-in-out infinite" },

  // Right login area
  rightPanel: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 24px", minHeight: "100vh", background: "#FAF7F2",
  },
  container: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center" },

  // Logo
  logoWrap: { textAlign: "center", marginBottom: 24 },
  logoHero: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  logoRing: {
    position: "relative", width: 88, height: 88, borderRadius: "50%",
    background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 0 0 rgba(180,60,40,0.3), 0 8px 32px rgba(0,0,0,0.15)",
    animation: "pulse 3s ease-in-out infinite",
  },
  logoGlow: { position: "absolute", inset: -6, borderRadius: "50%", background: "rgba(180,60,40,0.15)", filter: "blur(10px)", zIndex: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", position: "relative", zIndex: 1, display: "block" },
  logoText: { textAlign: "center" },
  brandTitle: { color: "#1E2A6E", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "2px", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2 },
  brandSub: { color: "#8B7355", fontSize: "0.75rem", marginTop: 3, letterSpacing: "0.8px", textTransform: "uppercase" },
  brandDivider: { width: 32, height: 2, background: "linear-gradient(90deg,#B43C28,#D4A017)", margin: "8px auto", borderRadius: 2 },
  brandTagline: { color: "#5A4A3A", fontSize: "0.7rem", letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.7 },

  // Card
  card: {
    width: "100%", background: "#FFFFFF", borderRadius: 20, padding: "36px 36px 32px",
    boxShadow: "0 8px 48px rgba(30,42,110,0.10), 0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid rgba(212,197,176,0.4)",
  },
  cardHeader: { marginBottom: 24 },
  cardTitle: { fontSize: "1.6rem", fontWeight: 700, color: "#1E2A6E", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.3px", lineHeight: 1.2 },
  cardSub: { marginTop: 6, fontSize: "0.84rem", color: "#9A8A7A" },

  // Alert
  alertBox: { display: "flex", alignItems: "center", gap: 8, borderWidth: "1px", borderStyle: "solid", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: "0.83rem" },

  // Fields
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4A3A2A", marginBottom: 6, letterSpacing: "0.3px", textTransform: "uppercase" },
  inputWrap: { display: "flex", alignItems: "center", borderWidth: "1.5px", borderStyle: "solid", borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s" },
  input: { flex: 1, height: 48, border: "none", outline: "none", padding: "0 14px", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif", color: "#1E2A6E", background: "transparent" },
  inputAddon: { paddingRight: 14, display: "flex", alignItems: "center", flexShrink: 0 },

  // Back button
  backBtn: { background: "none", border: "none", color: "#9A8A7A", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", padding: "0 0 16px 0", fontFamily: "'Inter', sans-serif", display: "block" },

  // Footer
  footer: { marginTop: 20, textAlign: "center", fontSize: "0.7rem", color: "#B4A090" },
};