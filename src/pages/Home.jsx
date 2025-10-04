import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import HeaderMobile from "../components/HeaderMobile";
import CatalogSection from "../components/CatalogSection";
import { usePlanning } from "../hooks/usePlanning"; // ✅ ton hook existant

export default function Home() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  // ✅ calcule la date du jour localement (évite l’import manquant)
  const todayYMD = new Date().toISOString().slice(0, 10);

  // 🗓️ tâches du jour via le hook existant
  // (ton hook doit exposer au moins { items, loading, toggleDone } pour la date donnée)
  const { items: today = [], loading, toggleDone } = usePlanning(todayYMD);

  const dayStr = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    []
  );

  return (
    <div style={styles.app}>
      <HeaderMobile title="Planificateur Séoul" />

      {/* Toasts globaux */}
      <ToastContainer position="top-center" autoClose={1500} theme="dark" pauseOnHover={false} />

      {/* Contenu principal */}
      <main style={styles.main}>
        {/* Bandeau Aujourd'hui */}
        <motion.section
          style={styles.card}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.25 }}
        >
          <div style={styles.rowSpace}>
            <div>
              <div style={styles.kicker}>Aujourd’hui</div>
              <div style={styles.h1}>{cap(dayStr)}</div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              style={styles.ghostBtn}
              onClick={() => {
                toast.info("Ouverture du planning…");
                navigate("/planning");
              }}
            >
              Voir planning
            </motion.button>
          </div>
        </motion.section>

        {/* Actions rapides */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          style={styles.quickActions}
        >
          {[
            { label: "Ajouter", onClick: () => setSheetOpen(true) },
            { label: "Explorer", onClick: () => navigate("/explore") },
            { label: "Planning", onClick: () => navigate("/planning") },
          ].map((a) => (
            <motion.button
              key={a.label}
              variants={chipIn}
              whileTap={{ scale: 0.98 }}
              onClick={a.onClick}
              style={styles.chip}
            >
              {a.label}
            </motion.button>
          ))}
        </motion.section>

        {/* Planning du jour (aperçu) */}
        <motion.section
          style={styles.card}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <h3 style={styles.h3}>Planning du jour</h3>
          {loading ? (
            <p style={styles.muted}>Chargement…</p>
          ) : today.length ? (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {today.slice(0, 6).map((item) => (
                <motion.label key={item.id} variants={rowIn} style={styles.todoRow}>
                  <input
                    type="checkbox"
                    checked={!!item.done}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      try {
                        await toggleDone(item.id, checked);
                        toast(checked ? "Tâche terminée ✅" : "Tâche réactivée", {
                          type: checked ? "success" : "info",
                        });
                      } catch {
                        toast.error("Impossible de mettre à jour la tâche");
                      }
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textDecoration: item.done ? "line-through" : "none",
                      opacity: item.done ? 0.7 : 1,
                    }}
                  >
                    {item.title}
                  </span>
                </motion.label>
              ))}
            </motion.div>
          ) : (
            <p style={styles.muted}>
              Rien de prévu. Appuie sur <strong>Ajouter</strong> pour commencer.
            </p>
          )}
        </motion.section>

        {/* Catalogue (section compacte importée comme composant) */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <CatalogSection />
        </motion.div>
      </main>

      {/* FAB (+) pour actions rapides */}
      <motion.button
        aria-label="Ajouter"
        onClick={() => {
          setSheetOpen(true);
          toast("Actions rapides ouvertes ✨", { type: "success" });
        }}
        style={styles.fab}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.96 }}
      >
        +
      </motion.button>

      {/* Bottom Sheet (actions rapides) */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              style={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              style={styles.sheet}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
            >
              <div style={styles.sheetHandle} />
              <h3 style={{ marginTop: 0 }}>Actions rapides</h3>
              <div style={{ display: "grid", gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  style={styles.primaryBtn}
                  onClick={() => {
                    setSheetOpen(false);
                    navigate("/catalog-add");
                    toast.success("Ajout d’une activité au catalogue");
                  }}
                >
                  Ajouter une activité au catalogue
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  style={styles.btn}
                  onClick={() => {
                    setSheetOpen(false);
                    navigate("/planning");
                    toast.info("Ajout d’une tâche au planning");
                  }}
                >
                  Ajouter une tâche au planning
                </motion.button>
              </div>

              <button style={styles.closeBtn} onClick={() => setSheetOpen(false)}>
                Fermer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------- Animations --------- */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const chipIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};
const rowIn = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

/* ----------------- Styles (mobile-first) ----------------- */
const styles = {
  app: {
    minHeight: "100dvh",
    background: "#0b0e12",
    color: "#e8ecf3",
    paddingBottom: 96,
  },
  main: {
    width: "80%",
    margin: "0 auto",
    padding: "18px 0",
    display: "grid",
    gap: 22,
    marginTop: 48,
  },
  card: {
    width: "100%",
    background: "#11151e",
    border: "1px solid #1f2633",
    borderRadius: 16,
    padding: 22,
    margin: "0 auto",
    boxShadow: "0 10px 28px rgba(0,0,0,.28)",
    boxSizing: "border-box",
  },
  rowSpace: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  kicker: { opacity: 0.7, fontSize: 12 },
  h1: { margin: 0, fontSize: 20, fontWeight: 800 },
  h3: { marginTop: 0, marginBottom: 8, fontSize: 17, fontWeight: 800 },
  muted: { opacity: 0.75, fontSize: 14 },

  quickActions: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    padding: "2px 2px 4px",
  },
  chip: {
    border: "1px solid #1f2633",
    background: "#11151e",
    color: "#e8ecf3",
    padding: "10px 14px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },

  todoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #1f2633",
  },
  ghostBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "transparent",
    color: "#e8ecf3",
    border: "1px solid #1f2633",
    cursor: "pointer",
  },
  btn: {
    padding: 14,
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#e8ecf3",
    fontWeight: 700,
    textAlign: "center",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: 14,
    borderRadius: 12,
    border: "1px solid #22c55e",
    background: "#22c55e",
    color: "#0b0e12",
    fontWeight: 800,
    textAlign: "center",
    cursor: "pointer",
  },
  closeBtn: {
    marginTop: 12,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #1f2633",
    background: "transparent",
    color: "#e8ecf3",
    cursor: "pointer",
  },
  fab: {
    position: "fixed",
    right: 70,
    bottom: 75,
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "none",
    background: "#7dd3fc",
    color: "#0b0e12",
    fontSize: 32,
    fontWeight: 900,
    boxShadow: "0 14px 30px rgba(125,211,252,.35)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    zIndex: 40,
  },
  sheet: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    background: "#11151e",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTop: "1px solid #1f2633",
    padding: 16,
    boxShadow: "0 -20px 40px rgba(0,0,0,.35)",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    background: "#1f2633",
    margin: "0 auto 12px",
  },
};

/* --------- Helpers --------- */
function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
