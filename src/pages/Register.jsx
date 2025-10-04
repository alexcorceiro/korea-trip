// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import HeaderMobile from "../components/HeaderMobile";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!name.trim()) return "Le nom est requis.";
    if (!email.trim()) return "L’e-mail est requis.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "E-mail invalide.";
    if (pwd.length < 6) return "Mot de passe trop court (≥ 6).";
    if (pwd !== pwd2) return "Les mots de passe ne correspondent pas.";
    return "";
    }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    try {
      setLoading(true);

      // 1) Création auth
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pwd);

      // 2) Profil affiché (nom)
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }

      // 3) Doc /users/{uid}
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          displayName: name.trim(),
          email: cred.user.email,
          photoURL: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("Compte créé 🎉");
      // petite pause pour laisser le toast s’afficher puis rediriger
      setTimeout(() => nav("/"), 300);
    } catch (e) {
      console.error(e);
      // Erreurs classiques: auth/email-already-in-use, auth/invalid-email, …
      toast.error(e.message || "Création impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={sx.app}>
      <HeaderMobile title="Créer un compte" />
      <ToastContainer position="top-center" autoClose={1700} theme="dark" pauseOnHover={false} />

      <main style={sx.main}>
        <form onSubmit={onSubmit} style={sx.card}>
          <h2 style={{ marginTop: 0 }}>Inscription</h2>

          <label style={sx.field}>
            <span style={sx.label}>Nom</span>
            <input
              style={sx.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Alex"
              autoComplete="name"
            />
          </label>

          <label style={sx.field}>
            <span style={sx.label}>E-mail</span>
            <input
              style={sx.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label style={sx.field}>
            <span style={sx.label}>Mot de passe</span>
            <input
              style={sx.input}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <label style={sx.field}>
            <span style={sx.label}>Confirmer le mot de passe</span>
            <input
              style={sx.input}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <button type="submit" disabled={loading} style={sx.primaryBtn}>
            {loading ? "Création…" : "Créer mon compte"}
          </button>

          <p style={{ ...sx.muted, marginTop: 10 }}>
            Déjà un compte ?{" "}
            <Link to="/login" style={sx.link}>
              Se connecter
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

const sx = {
  app: { minHeight: "100dvh", background: "#0b0e12", color: "#e8ecf3", paddingBottom: 60 },
  main: { maxWidth: 480, margin: "0 auto", padding: 16 },
  card: {
    background: "#11151e",
    border: "1px solid #1f2633",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    display: "grid",
    gap: 12,
  },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, opacity: 0.9 },
  input: {
    height: 44,
    padding: "0 12px",
    borderRadius: 12,
    background: "#0f1420",
    border: "1px solid #1f2633",
    color: "#e8ecf3",
    outline: "none",
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    border: "1px solid #22c55e",
    background: "linear-gradient(180deg,#22c55e,#16a34a)",
    color: "#0b0e12",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(34,197,94,.25)",
  },
  muted: { opacity: 0.8, fontSize: 13, textAlign: "center" },
  link: { color: "#7dd3fc", textDecoration: "underline" },
};
