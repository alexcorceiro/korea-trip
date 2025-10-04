// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email || !pwd) {
      toast.warn("Entre ton email et mot de passe.");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pwd);
      toast.success("Connexion réussie ✅");
      // petite pause pour le toast puis navigation
      setTimeout(() => nav("/"), 300);
    } catch (err) {
      console.error(err);
      toast.error("Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={sx.app}>
      <ToastContainer position="top-center" autoClose={1500} theme="dark" pauseOnHover={false} />
      <main style={sx.main}>
        <section style={sx.card}>
          <h1 style={sx.h1}>Connexion</h1>

          <form onSubmit={onSubmit} style={sx.form}>
            <label style={sx.field}>
              <span style={sx.label}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={sx.input}
                placeholder="ton@email.com"
              />
            </label>

            <label style={sx.field}>
              <span style={sx.label}>Mot de passe</span>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="current-password"
                required
                style={sx.input}
                placeholder="••••••••"
              />
            </label>

            <button type="submit" disabled={loading} style={sx.primaryBtn}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p style={sx.meta}>
            Pas encore de compte ?{" "}
            {/* ✅ IMPORTANT: garder un <Link> (pas de preventDefault) */}
            <Link to="/register" style={sx.link}>
              Crée un compte ici
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

const sx = {
  app: {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    background: "#0b0e12",
    color: "#e8ecf3",
    padding: "24px 12px",
  },
  main: { width: "100%", maxWidth: 420, margin: "0 auto" },
  card: {
    background: "#11151e",
    border: "1px solid #1f2633",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 24px rgba(0,0,0,.35)",
  },
  h1: { margin: 0, marginBottom: 12, fontSize: 22, fontWeight: 800, textAlign: "center" },
  form: { display: "grid", gap: 12, marginTop: 10 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, opacity: 0.9 },
  input: {
    height: 46,
    padding: "0 12px",
    borderRadius: 12,
    background: "#0f1420",
    border: "1px solid #1f2633",
    color: "#e8ecf3",
    outline: "none",
  },
  primaryBtn: {
    marginTop: 6,
    height: 46,
    borderRadius: 12,
    border: "1px solid #22c55e",
    background: "linear-gradient(180deg,#22c55e,#16a34a)",
    color: "#0b0e12",
    fontWeight: 800,
    cursor: "pointer",
  },
  meta: { marginTop: 12, textAlign: "center", opacity: 0.9 },
  link: { color: "#7dd3fc", fontWeight: 700, textDecoration: "underline" },
};
