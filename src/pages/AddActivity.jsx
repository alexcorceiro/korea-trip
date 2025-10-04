import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderMobile from "../components/HeaderMobile";
import ActivityForm from "../components/ActivityForm";
import { useActivities } from "../hooks/useActivites";
import { useAuthCtx } from "../context/AuthProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddActivity() {
  const nav = useNavigate();
  const { createActivity } = useActivities();
  const { user } = useAuthCtx();

  const [submitting, setSubmitting] = useState(false);

  // État contrôlé pour la prévisualisation live
  const [draft, setDraft] = useState({
    name: "",
    category: "Culture",
    neighborhood: "",
    address: "",
    image: "",
    googleUrl: "",           // ⬅️ URL Google Maps complète
    rating: "",
    averagePriceKrw: "",
    reservationRequired: false,
    suggestedTimeSlot: "",
    notes: "",
  });

  async function handleCreate(data) {
    if (!user?.uid) {
      toast.error("Connecte-toi pour ajouter une activité.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        rating: data.rating === "" ? null : Number(data.rating),
        averagePriceKrw: data.averagePriceKrw === "" ? null : Number(data.averagePriceKrw),
        createBy: user.uid,
        favoritesUser: [],
      };
      await createActivity(payload);
      toast.success("Activité ajoutée ✅");
      setTimeout(() => nav(-1), 800);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Erreur lors de l’ajout.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0b0e12", color: "#e8ecf3", paddingBottom: 80 }}>
      {/* ✅ Header mobile ajouté */}
      <HeaderMobile title="Ajouter une activité" />
      <ToastContainer position="top-center" autoClose={1600} theme="dark" pauseOnHover={false} />

      <main style={styles.page}>
        <h2 style={styles.h2}>Informations</h2>

        {/* Formulaire + prévisualisation */}
        <div style={styles.columns}>
          <div style={styles.colForm}>
            <ActivityForm
              value={draft}
              onChange={setDraft}
              onSubmit={handleCreate}
              submitting={submitting}
            />
          </div>

          <aside style={styles.colPreview}>
            <PreviewCard data={draft} />
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ---------- Prévisualisation simple ---------- */
function PreviewCard({ data }) {
  const price = data.averagePriceKrw ? Number(data.averagePriceKrw).toLocaleString("ko-KR") : "-";
  return (
    <div style={styles.previewCard}>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
        <div style={styles.thumbWrap}>
          {data.image ? (
            <img src={data.image} alt={data.name || "image"} style={styles.thumb} />
          ) : (
            <div style={styles.thumbFallback}>📷</div>
          )}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ margin: 0 }}>{data.name || "Sans titre"}</h3>
            <span style={styles.badge}>{data.category || "—"}</span>
          </div>
          <div style={styles.meta}>
            {(data.neighborhood || "Séoul")} · ⭐ {data.rating || "-"} · ₩ {price}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {data.suggestedTimeSlot && <span style={styles.tag}>{data.suggestedTimeSlot}</span>}
            {data.reservationRequired && <span style={styles.tagWarn}>Réservation</span>}
          </div>
          {data.address && <div style={{ marginTop: 8, opacity: 0.8 }}>{data.address}</div>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: 16 },
  h2: { margin: "8px 0 12px" },
  columns: { display: "grid", gridTemplateColumns: "1fr", gap: 16 },
  colForm: { width: "100%" },
  colPreview: { width: "100%" },
  previewCard: {
    background: "#11151e",
    border: "1px solid #1f2633",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
  },
  thumbWrap: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #1f2633",
    background: "#0f1420",
    display: "grid",
    placeItems: "center",
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbFallback: { fontSize: 32, opacity: 0.7 },
  meta: { opacity: 0.8, fontSize: 14, marginTop: 4 },
  badge: {
    background: "#0f1420",
    border: "1px solid #1f2633",
    borderRadius: 10,
    padding: "4px 8px",
    fontSize: 12,
  },
  tag: {
    fontSize: 12,
    color: "#0b0e12",
    background: "linear-gradient(90deg,#7dd3fc,#a78bfa)",
    padding: "4px 10px",
    borderRadius: 999,
  },
  tagWarn: {
    fontSize: 12,
    color: "#0b0e12",
    background: "#fcd34d",
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 700,
  },
};
