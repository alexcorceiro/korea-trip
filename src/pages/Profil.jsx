import { useEffect, useMemo, useState } from "react";
import HeaderMobile from "../components/HeaderMobile";
import { useAuthCtx } from "../context/AuthProvider";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* --------- Icônes --------- */
function Trash({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M3 6h18M9 6v-.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V6M6 6l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" />
    </svg>
  );
}
function Star({ filled = false, size = 18 }) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.3l-6.16 3.24 1.18-6.88L1 8.76l6.92-1L12 1.5l3.09 6.26 6.92 1-5.02 4.9 1.18 6.88z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5L9 8 3.5 8.8 7.6 12.7 6.6 18.2 11.5 15.6 16.4 18.2 15.4 12.7 19.5 8.8 14 8 11.48 3.5z" />
    </svg>
  );
}

const ACTIVITIES_PATH = "groups/main/activities";

export default function Profile() {
  const { user } = useAuthCtx();

  // Si pas connecté, on affiche juste le header + info
  if (!user) {
    return (
      <div style={sx.app}>
        <HeaderMobile title="Profil" />
        <main style={sx.main}>
          <section style={sx.card}>
            <p style={sx.muted}>Tu dois être connecté pour accéder à ton profil.</p>
          </section>
        </main>
      </div>
    );
  }

  const [displayName, setName] = useState(user.displayName || "");
  const [photoURL, setPhoto] = useState(user.photoURL || "");
  const [saving, setSaving] = useState(false);

  const [created, setCreated] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Flux temps réel — activités créées par l’utilisateur
  useEffect(() => {
    if (!user?.uid) return;

    const qCreated = query(
      collection(db, ACTIVITIES_PATH),
      where("createBy", "==", user.uid),
      // si l'index n'existe pas encore, Firestore te proposera de le créer
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      qCreated,
      (snap) => setCreated(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("created/onSnapshot:", err)
    );

    return () => unsub();
  }, [user?.uid]);

  // Flux temps réel — activités favorites de l’utilisateur
  useEffect(() => {
    if (!user?.uid) return;

    const qFav = query(
      collection(db, ACTIVITIES_PATH),
      where("favoritesUser", "array-contains", user.uid),
      orderBy("name", "asc")
    );

    const unsub = onSnapshot(
      qFav,
      (snap) => setFavorites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("favorites/onSnapshot:", err)
    );

    return () => unsub();
  }, [user?.uid]);

  const counts = useMemo(
    () => ({ created: created.length, favorites: favorites.length }),
    [created.length, favorites.length]
  );

  async function saveProfile(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || null,
        photoURL: photoURL.trim() || null,
      });
      toast.success("Profil mis à jour ✅");
    } catch (e) {
      console.error(e);
      toast.error("Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  }

  async function removeFromFavorites(activityId) {
    try {
      await updateDoc(doc(db, ACTIVITIES_PATH, activityId), {
        favoritesUser: arrayRemove(user.uid),
      });
      toast.info("Retiré des favoris");
    } catch (e) {
      console.error(e);
      toast.error("Action impossible.");
    }
  }

  async function deleteActivity(activityId) {
    if (!confirm("Supprimer définitivement cette activité ?")) return;
    try {
      await deleteDoc(doc(db, ACTIVITIES_PATH, activityId));
      toast.success("Activité supprimée 🗑️");
    } catch (e) {
      console.error(e);
      toast.error("Suppression impossible.");
    }
  }

  function openMaps(a) {
    const link = a.mapsLink || a.googleQuery; // compat
    if (!link) {
      toast.info("Aucun lien Google Maps.");
      return;
    }
    if (!navigator.onLine) {
      toast.warn("Hors-ligne : Google Maps nécessite Internet.");
      return;
    }
    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener");
    } else {
      const q = encodeURIComponent(link);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
    }
  }

  const initial = (displayName || user.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div style={sx.app}>
      <HeaderMobile title="Profil" />
      <ToastContainer position="top-center" autoClose={1600} theme="dark" pauseOnHover={false} />

      <main style={sx.main}>
        {/* Carte profil / édition */}
        <section style={{ ...sx.card, ...sx.profileCard }}>
          <div style={sx.profileHeader}>
            <div style={sx.avatarWrap}>
              {photoURL ? (
                <img src={photoURL} alt={displayName || "avatar"} style={sx.avatarImg} />
              ) : (
                <div style={sx.avatarFallback}>{initial}</div>
              )}
            </div>
            <div>
              <div style={sx.title}>{displayName || user.email}</div>
              <div style={sx.muted}>{user.email}</div>
              <div style={sx.statsRow}>
                <span style={sx.badge}>{counts.created} créées</span>
                <span style={sx.badge}>{counts.favorites} favoris</span>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} style={sx.form}>
            <div style={sx.grid2}>
              <label style={sx.field}>
                <span style={sx.label}>Nom affiché</span>
                <input
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Alex"
                  style={sx.input}
                  autoComplete="name"
                />
              </label>
              <label style={sx.field}>
                <span style={sx.label}>Avatar (URL)</span>
                <input
                  value={photoURL}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://…/avatar.jpg"
                  style={sx.input}
                  autoComplete="photo"
                />
              </label>
            </div>

            <button type="submit" disabled={saving} style={sx.primaryBtn}>
              {saving ? "Enregistrement…" : "Enregistrer le profil"}
            </button>
          </form>
        </section>

        {/* Activités créées */}
        <section style={sx.card}>
          <div style={sx.rowSpace}>
            <h3 style={sx.h3}>Mes activités créées</h3>
            <div style={sx.kicker}>{counts.created}</div>
          </div>

          {created.length === 0 ? (
            <p style={sx.muted}>Tu n’as pas encore ajouté d’activité.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {created.map((a) => (
                <article key={a.id} style={sx.itemCard}>
                  <div style={sx.itemLeft}>
                    <div style={sx.thumbWrap}>
                      {a.image ? (
                        <img src={a.image} alt={a.name} style={sx.thumb} />
                      ) : (
                        <div style={sx.thumbFallback}>📍</div>
                      )}
                    </div>
                    <div>
                      <div style={sx.itemTitle}>{a.name}</div>
                      <div style={sx.meta}>
                        {(a.neighborhood || "Séoul")} · ⭐ {a.rating ?? "-"} · ₩
                        {(a.averagePriceKrw || 0).toLocaleString("ko-KR")}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={() => openMaps(a)} style={sx.btn}>Ouvrir Maps</button>
                        <button
                          onClick={() => deleteActivity(a.id)}
                          style={{ ...sx.ghostBtn, color: "#ef4444", borderColor: "#ef4444" }}
                          title="Supprimer"
                        >
                          <Trash /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Favoris */}
        <section style={sx.card}>
          <div style={sx.rowSpace}>
            <h3 style={sx.h3}>Mes favoris</h3>
            <div style={sx.kicker}>{counts.favorites}</div>
          </div>

          {favorites.length === 0 ? (
            <p style={sx.muted}>Aucun favori… ajoute-en depuis la page Explorer.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {favorites.map((a) => (
                <article key={a.id} style={sx.itemCard}>
                  <div style={sx.itemLeft}>
                    <div style={sx.thumbWrap}>
                      {a.image ? (
                        <img src={a.image} alt={a.name} style={sx.thumb} />
                      ) : (
                        <div style={sx.thumbFallback}>📍</div>
                      )}
                    </div>
                    <div>
                      <div style={sx.itemTitle}>{a.name}</div>
                      <div style={sx.meta}>
                        {(a.neighborhood || "Séoul")} · ⭐ {a.rating ?? "-"} · ₩
                        {(a.averagePriceKrw || 0).toLocaleString("ko-KR")}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={() => openMaps(a)} style={sx.btn}>Ouvrir Maps</button>
                        <button onClick={() => removeFromFavorites(a.id)} style={sx.ghostBtn} title="Retirer des favoris">
                          <Star filled /> Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* -------------------- Styles -------------------- */
const sx = {
  app: {
    minHeight: "100dvh",
    background: "#0b0e12",
    color: "#e8ecf3",
    paddingBottom: 80,
  },
  main: {
    width: "85%",
    margin: "0 auto",
    padding: 16,
    display: "grid",
    gap: 16,
    marginTop: 24,
  },
  card: {
    width: "100%",
    maxWidth: "80%",
    margin: "0 auto",
    background: "#11151e",
    border: "1px solid #1f2633",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    boxSizing: "border-box",
  },
  profileCard: { paddingTop: 14, paddingBottom: 16 },
  profileHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 8 },
  avatarWrap: {
    width: 68, height: 68, borderRadius: "50%", overflow: "hidden",
    border: "1px solid #1f2633", background: "#0f1420", display: "grid", placeItems: "center"
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  avatarFallback: {
    width: "100%", height: "100%", display: "grid", placeItems: "center",
    fontWeight: 900, fontSize: 24, background: "linear-gradient(135deg,#7dd3fc,#a78bfa)", color: "#0b0e12"
  },
  title: { fontWeight: 900, fontSize: 18, marginBottom: 2 },
  muted: { opacity: 0.75, fontSize: 13 },
  statsRow: { display: "flex", gap: 8, marginTop: 8 },
  badge: { fontSize: 12, color: "#0b0e12", background: "linear-gradient(90deg,#7dd3fc,#a78bfa)", padding: "4px 10px", borderRadius: 999 },

  form: { display: "grid", gap: 10, marginTop: 10 },
  grid2: { display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, opacity: 0.9 },
  input: {
    height: 44, padding: "0 12px", borderRadius: 12,
    background: "#0f1420", border: "1px solid #1f2633", color: "#e8ecf3", outline: "none"
  },
  primaryBtn: {
    marginTop: 2, height: 46, borderRadius: 12,
    border: "1px solid #22c55e", background: "linear-gradient(180deg,#22c55e,#16a34a)",
    color: "#0b0e12", fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 26px rgba(34,197,94,.25)"
  },

  rowSpace: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  kicker: { opacity: 0.7, fontSize: 12 },
  h3: { marginTop: 0, marginBottom: 6, fontSize: 16, fontWeight: 800 },

  itemCard: { background: "#0f1420", border: "1px solid #1f2633", borderRadius: 12, padding: 12 },
  itemLeft: { display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, alignItems: "center" },
  itemTitle: { fontWeight: 800 },
  meta: { opacity: 0.75, fontSize: 13, marginTop: 3 },

  thumbWrap: {
    width: 90, height: 70, borderRadius: 10, overflow: "hidden",
    border: "1px solid #1f2633", background: "#0f1420", display: "grid", placeItems: "center"
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbFallback: { fontSize: 24, opacity: 0.7 },

  btn: {
    padding: "8px 12px", borderRadius: 10,
    border: "1px solid #374151", background: "#1f2937",
    color: "#e8ecf3", fontWeight: 700, cursor: "pointer"
  },
  ghostBtn: {
    padding: "8px 12px", borderRadius: 10,
    border: "1px solid #1f2633", background: "transparent",
    color: "#e8ecf3", cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center"
  },
};
