import { useMemo, useState } from "react";
import HeaderMobile from "../components/HeaderMobile";

// ✅ bon hook / bon chemin
import { useActivities } from "../hooks/useActivites";

import { useAuthCtx } from "../context/AuthProvider";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { PATHS } from "../config/paths";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ---------- Icônes SVG ---------- */
function Heart({ filled = false, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    style: { display: "block" },
  };
  if (filled) {
    return (
      <svg {...common} fill="currentColor">
        <path d="M11.645 20.91l-.007-.003-.022-.012a27.49 27.49 0 01-.383-.218 32.944 32.944 0 01-5.264-3.683C2.445 14.054 1 11.799 1 9.352 1 6.95 2.9 5 5.25 5c1.41 0 2.75.654 3.75 1.74C10 5.654 11.34 5 12.75 5 15.1 5 17 6.95 17 9.352c0 2.447-1.446 4.702-4.97 7.642a32.96 32.96 0 01-5.264 3.683 27.49 27.49 0 01-.383.218l-.022.012-.007.003a.75.75 0 01-.69-1.324l.008-.005.02-.012.077-.043c.066-.037.159-.09.276-.159a31.442 31.442 0 005.013-3.508c3.246-2.704 4.742-4.709 4.742-6.506 0-1.735-1.289-3.102-2.75-3.102-1.102 0-2.213.7-2.726 1.837a.75.75 0 01-1.368 0C8.395 6.7 7.284 6 6.182 6 4.72 6 3.432 7.367 3.432 9.102c0 1.797 1.496 3.802 4.742 6.506a31.442 31.442 0 005.013 3.508c.117.069.21.122.276.159l.077.043.02.012.008.005a.75.75 0 01-.69 1.324z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0 2.485-2.239 4.5-5 4.5-1.657 0-3.127-.746-4-1.905-.873 1.159-2.343 1.905-4 1.905-2.761 0-5-2.015-5-4.5C3 5.764 5.239 3.75 8 3.75c1.657 0 3.127.746 4 1.905.873-1.159 2.343-1.905 4-1.905 2.761 0 5 2.015 5 4.5z"
      />
    </svg>
  );
}

export default function Explore() {
  const { items, loading, toggleFavorite } = useActivities();
  const { user } = useAuthCtx();

  // UI
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Tous");
  const [sort, setSort] = useState("name-asc"); // name-asc | rating-desc | price-asc | price-desc
  const [onlyFav, setOnlyFav] = useState(false);

  // Catégories dynamiques
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["Tous", ...Array.from(set)];
  }, [items]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    let arr = items.filter((a) => {
      if (category !== "Tous" && a.category !== category) return false;
      if (onlyFav && !a.favoritesUser?.includes(user?.uid || "")) return false;
      if (!term) return true;
      const hay =
        (a.name || "") +
        " " +
        (a.neighborhood || "") +
        " " +
        (a.notes || "") +
        " " +
        (a.address || "");
      return hay.toLowerCase().includes(term);
    });

    switch (sort) {
      case "rating-desc":
        arr = arr.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "price-asc":
        arr = arr
          .slice()
          .sort((a, b) => (a.averagePriceKrw || 0) - (b.averagePriceKrw || 0));
        break;
      case "price-desc":
        arr = arr
          .slice()
          .sort((a, b) => (b.averagePriceKrw || 0) - (a.averagePriceKrw || 0));
        break;
      default:
        arr = arr
          .slice()
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return arr;
  }, [items, q, category, onlyFav, sort, user?.uid]);

  // Ajouter au planning
  async function addToPlanning(activity) {
    if (!user?.uid) {
      toast.error("Connecte-toi pour ajouter au planning.");
      return;
    }
    try {
      const col = collection(db, PATHS.planning); // ✅ chemin centralisé
      await addDoc(col, {
        title: activity.name || "Sans titre",
        category: activity.category || "",
        when: "", // planifié plus tard
        done: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createBy: user.uid,
      });
      toast.success("Ajouté au planning ✅");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l’ajout au planning.");
    }
  }

  // Toggle favoris (avec icône & toast)
  async function onToggleFav(a) {
    if (!user?.uid) return toast.info("Connecte-toi pour gérer tes favoris.");
    const wasFav = a.favoritesUser?.includes(user.uid);
    try {
      await toggleFavorite(a.id);
      toast(wasFav ? "Retiré des favoris" : "Ajouté aux favoris ⭐", {
        type: wasFav ? "info" : "success",
      });
    } catch (e) {
      console.error(e);
      toast.error("Impossible de mettre à jour le favori.");
    }
  }

  // Ouvrir Maps (gère URL absolue ou recherche)
  function openMaps(a) {
    if (!navigator.onLine) {
      toast.warn("Hors-ligne : Google Maps nécessite Internet.");
      return;
    }
    const link = a.mapsLink || a.googleQuery || a.name || "Seoul";
    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener");
    } else {
      const query = encodeURIComponent(link);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank",
        "noopener"
      );
    }
  }

  // Copier adresse
  async function copyAddress(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Adresse copiée ✅");
    } catch {
      toast.error("Copie impossible.");
    }
  }

  return (
    <div style={styles.app}>
      <HeaderMobile title="Explorer" />
      <ToastContainer position="top-center" autoClose={1600} theme="dark" pauseOnHover={false} />

      <main style={styles.main}>
        {/* Barre d’outils plus aérée */}
        <section style={{ ...styles.card, ...styles.tools }}>
          {/* Ligne 1 : recherche */}
          <div style={styles.toolbarRow}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (activité, quartier, note)…"
              style={styles.input}
            />
          </div>

          {/* Ligne 2 : catégories / favoris / tri */}
          <div style={styles.toolbarRow}>
            <div style={styles.chipsWrap}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{ ...styles.chip, ...(c === category ? styles.chipActive : null) }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={styles.rightControls}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={onlyFav}
                  onChange={(e) => setOnlyFav(e.target.checked)}
                />{" "}
                Mes favoris
              </label>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={styles.select}
              >
                <option value="name-asc">Nom A→Z</option>
                <option value="rating-desc">Note ↓</option>
                <option value="price-asc">Prix ↑</option>
                <option value="price-desc">Prix ↓</option>
              </select>
            </div>
          </div>
        </section>

        {/* Résultats */}
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <section style={{ ...styles.card, textAlign: "center" }}>
            <p style={styles.muted}>Aucun résultat. Essaie une autre recherche ou catégorie.</p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {filtered.map((a) => {
              const isFav = a.favoritesUser?.includes(user?.uid || "");
              return (
                <article key={a.id} style={styles.card}>
                  <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 12 }}>
                    <div style={styles.thumbWrap}>
                      {a.image ? (
                        <img src={a.image} alt={a.name} style={styles.thumb} />
                      ) : (
                        <div style={styles.thumbFallback}>📍</div>
                      )}
                    </div>

                    <div>
                      <div style={styles.titleRow}>
                        <h3 style={styles.h3}>{a.name}</h3>
                        <div style={{ display: "flex", gap: 6 }}>
                          {/* Bouton favori avec icône */}
                          <button
                            onClick={() => onToggleFav(a)}
                            style={{
                              ...styles.iconBtn,
                              ...(isFav ? styles.favIconActive : null),
                            }}
                            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                            aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            <Heart size={18} filled={isFav} />
                          </button>

                          <button
                            onClick={() => addToPlanning(a)}
                            style={styles.primaryBtn}
                            title="Ajouter au planning"
                          >
                            + Planning
                          </button>
                        </div>
                      </div>

                      <div style={styles.meta}>
                        {(a.neighborhood || "Séoul")} · ⭐ {a.rating ?? "-"} · ₩
                        {(a.averagePriceKrw || 0).toLocaleString("ko-KR")}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {a.suggestedTimeSlot && <span style={styles.tag}>{a.suggestedTimeSlot}</span>}
                        {a.category && <span style={styles.tag}>{a.category}</span>}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button onClick={() => openMaps(a)} style={styles.btn}>
                          Ouvrir Maps
                        </button>
                        {a.address && (
                          <button onClick={() => copyAddress(a.address)} style={styles.ghostBtn}>
                            Copier l’adresse
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* --------- Skeleton simple --------- */
function SkeletonList() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ ...styles.card, ...styles.skeleton }} />
      ))}
    </div>
  );
}

/* -------------------- STYLES -------------------- */
const styles = {
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
    padding: 20,
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    boxSizing: "border-box",
  },
  tools: { position: "sticky", top: 56, zIndex: 10 },

  toolbarRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginTop: 12,
    flexWrap: "wrap",
  },

  input: {
    flex: 1,
    minWidth: 260,
    height: 46,
    padding: "0 14px",
    borderRadius: 12,
    background: "#0f1420",
    border: "1px solid #1f2633",
    color: "#e8ecf3",
    outline: "none",
  },

  chipsWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    rowGap: 10,
    overflowX: "auto",
    paddingBottom: 2,
  },
  chip: {
    border: "1px solid #1f2633",
    background: "#11151e",
    color: "#e8ecf3",
    padding: "10px 14px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  chipActive: {
    background: "#7dd3fc",
    borderColor: "#7dd3fc",
    color: "#0b0e12",
    fontWeight: 800,
  },

  rightControls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
    flexWrap: "wrap",
  },
  select: {
    height: 42,
    padding: "0 12px",
    borderRadius: 10,
    background: "#0f1420",
    border: "1px solid #1f2633",
    color: "#e8ecf3",
    outline: "none",
  },
  label: { fontSize: 14, opacity: 0.9 },

  h3: { margin: 0, fontSize: 16, fontWeight: 800 },
  titleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  meta: { opacity: 0.75, fontSize: 13, marginTop: 4 },
  tag: {
    fontSize: 12,
    color: "#0b0e12",
    background: "linear-gradient(90deg, #7dd3fc, #a78bfa)",
    padding: "4px 10px",
    borderRadius: 999,
  },

  ghostBtn: {
    padding: "8px 12px",
    borderRadius: 10,
    background: "transparent",
    color: "#e8ecf3",
    border: "1px solid #1f2633",
    cursor: "pointer",
  },

  // 🔥 bouton icône favori
  iconBtn: {
    width: 36,
    height: 36,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    border: "1px solid #1f2633",
    background: "#0f1420",
    color: "#e8ecf3",
    cursor: "pointer",
  },
  favIconActive: {
    background: "#fde68a",
    borderColor: "#fbbf24",
    color: "#0b0e12",
    fontWeight: 800,
  },

  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#e8ecf3",
    fontWeight: 700,
    textAlign: "center",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #22c55e",
    background: "#22c55e",
    color: "#0b0e12",
    fontWeight: 800,
    textAlign: "center",
    cursor: "pointer",
  },

  thumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #1f2633",
    background: "#0f1420",
    display: "grid",
    placeItems: "center",
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbFallback: { fontSize: 28, opacity: 0.7 },

  muted: { opacity: 0.75, fontSize: 14, margin: 0 },

  skeleton: {
    height: 84,
    background: "linear-gradient(100deg, #0f1420 40%, #151b27 50%, #0f1420 60%)",
    backgroundSize: "200% 100%",
    animation: "shine 1.2s linear infinite",
  },
};
