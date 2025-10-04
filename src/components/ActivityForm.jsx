import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

/** --- Helpers image & URL --- **/
const isValidUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const isImageUrl = (url) => {
  if (!isValidUrl(url)) return false;
  const pathname = url.split("?")[0].toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(pathname);
};

/** --- Données constantes --- **/
const CATEGORIES = [
  "Culture",
  "Découverte",
  "Food",
  "Nightlife",
  "Shopping",
  "Nature",
  "Expérience",
  "Transport",
];
const SLOTS = ["Matin", "Après-midi", "Soirée", "Journée"];

export default function ActivityForm({
  value,
  onChange,
  onSubmit,
  submitting = false,
  initial = null,
}) {
  const [local, setLocal] = useState(() => ({
    name: initial?.name || "",
    category: initial?.category || "Culture",
    neighborhood: initial?.neighborhood || "",
    address: initial?.address || "",
    image: initial?.image || "",
    googleUrl: initial?.googleUrl || "",
    rating: initial?.rating ?? "",
    averagePriceKrw: initial?.averagePriceKrw ?? "",
    reservationRequired: !!initial?.reservationRequired,
    suggestedTimeSlot: initial?.suggestedTimeSlot || "",
    notes: initial?.notes || "",
  }));

  const form = value ?? local;
  const setForm = onChange ?? setLocal;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const title = initial ? "Modifier l’activité" : "Nouvelle activité";

  /** --- VALIDATION --- **/
  const errors = useMemo(() => {
    const list = [];
    if (!form.name.trim()) list.push("Le nom est requis.");
    if (!CATEGORIES.includes(form.category)) list.push("Catégorie invalide.");
    if (form.rating !== "" && (Number(form.rating) < 0 || Number(form.rating) > 5))
      list.push("La note doit être entre 0 et 5.");

    // 🔍 Validation Google Maps
    if (form.googleUrl) {
      const ok =
        /^https:\/\/www\.google\.com\/maps\//.test(form.googleUrl) ||
        /^https:\/\/maps\.app\.goo\.gl\//.test(form.googleUrl);
      if (!ok)
        list.push("Colle une URL Google Maps valide (google.com/maps ou maps.app.goo.gl).");
    }

    // 🖼️ Validation image
    if (form.image) {
      if (!isImageUrl(form.image)) {
        list.push(
          "L’URL d’image doit être un lien direct vers un fichier .jpg, .jpeg, .png, .webp, .gif, .bmp ou .svg."
        );
      }
    }

    return list;
  }, [form]);

  /** --- Aperçu image --- **/
  const [imgOk, setImgOk] = useState(null);
  useEffect(() => {
    if (!form.image) {
      setImgOk(null);
      return;
    }
    if (!isImageUrl(form.image)) {
      setImgOk(false);
      return;
    }

    const img = new Image();
    img.onload = () => setImgOk(true);
    img.onerror = () => setImgOk(false);
    img.src = form.image;
  }, [form.image]);

  /** --- Bulle d’aide Google Maps --- **/
  const [showHint, setShowHint] = useState(false);

  /** --- Fonctions utilitaires --- **/
  const tryOpenMaps = () => {
    if (form.googleUrl) {
      window.open(form.googleUrl, "_blank", "noopener");
    } else {
      const q = encodeURIComponent(form.name || "Seoul");
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (!txt) return toast.info("Presse-papiers vide.");
      set("googleUrl", txt.trim());
      toast.success("URL collée ✅");
    } catch {
      toast.error("Impossible d’accéder au presse-papiers.");
    }
  };

  /** --- Soumission --- **/
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    try {
      const payload = {
        ...form,
        rating: form.rating === "" ? null : Number(form.rating),
        averagePriceKrw:
          form.averagePriceKrw === "" ? null : Number(form.averagePriceKrw),
      };

      // 🔁 Nettoyage : si image invalide, on la vide
      if (payload.image && !isImageUrl(payload.image)) {
        toast.warn("L’URL d’image est invalide, elle a été ignorée.");
        payload.image = "";
      }

      await onSubmit(payload);

      if (!initial && !value) {
        setForm((f) => ({
          ...f,
          name: "",
          neighborhood: "",
          address: "",
          image: "",
          googleUrl: "",
          rating: "",
          averagePriceKrw: "",
          notes: "",
          suggestedTimeSlot: "",
          reservationRequired: false,
        }));
      }
      toast.success("Activité enregistrée ✅");
    } catch (e2) {
      toast.error(e2?.message || "Erreur lors de l’enregistrement.");
    }
  };

  /** --- Rendu --- **/
  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <ToastContainer position="top-center" autoClose={1600} theme="dark" pauseOnHover={false} />

      <h3 style={{ margin: 0 }}>{title}</h3>

      {/* Nom */}
      <label style={styles.row}>
        <span>Nom *</span>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          style={styles.input}
          placeholder="Ex: Palais Gyeongbokgung"
        />
      </label>

      {/* Catégorie */}
      <label style={styles.row}>
        <span>Catégorie *</span>
        <select
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          style={styles.input}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Quartier / Adresse */}
      <div style={styles.grid}>
        <label style={styles.row}>
          <span>Quartier</span>
          <input
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
            style={styles.input}
            placeholder="Ex: Jongno, Hongdae, Itaewon…"
          />
        </label>
        <label style={styles.row}>
          <span>Adresse</span>
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            style={styles.input}
            placeholder="Ex: 161 Sajik-ro, Jongno-gu…"
          />
        </label>
      </div>

      {/* Image */}
      <div style={styles.grid}>
        <label style={styles.row}>
          <span>Image (URL directe)</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              style={{ ...styles.input, flex: 1 }}
              placeholder="https://…jpg / .png / .webp"
            />
            <button
              type="button"
              onClick={() =>
                form.image
                  ? toast.success("Image testée (voir aperçu) 👍")
                  : toast.info("Aucune URL")
              }
              style={styles.btnGhost}
              title="Tester l’image"
            >
              Tester
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            {imgOk === true && (
              <img
                src={form.image}
                alt="preview"
                style={{
                  width: 140,
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #1f2633",
                }}
              />
            )}
            {imgOk === false && (
              <span style={{ color: "#f87171" }}>
                Impossible de charger l’image (vérifie le lien).
              </span>
            )}
          </div>
        </label>

        {/* Google URL */}
        <label style={styles.row}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            URL Google Maps
            <i
              onClick={() => setShowHint((v) => !v)}
              title="Aide"
              style={styles.infoDot}
              role="button"
            >
              i
            </i>
          </span>

          <div style={{ position: "relative" }}>
            <input
              type="url"
              value={form.googleUrl}
              onChange={(e) => set("googleUrl", e.target.value)}
              placeholder="https://www.google.com/maps/place/…"
              style={{ ...styles.input, paddingRight: 144, wordBreak: "break-all" }}
            />
            <div style={styles.actionsRight}>
              <button type="button" onClick={pasteFromClipboard} style={styles.smallBtn}>
                Coller
              </button>
              <button type="button" onClick={tryOpenMaps} style={styles.smallBtn}>
                Maps
              </button>
            </div>

            {showHint && (
              <div style={styles.hint}>
                <strong>Colle l’URL Google Maps complète</strong>
                <br />
                Exemple :
                <br />
                <code style={{ opacity: 0.9 }}>
                  https://www.google.com/maps/place/Bukchon+Hanok+Village/
                </code>
                <br />
                (Les liens <code>https://maps.app.goo.gl/…</code> sont aussi acceptés.)
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Note / Prix */}
      <div style={styles.grid}>
        <label style={styles.row}>
          <span>Note (0–5)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={form.rating}
            onChange={(e) => set("rating", e.target.value)}
            style={styles.input}
            placeholder="4.6"
          />
        </label>
        <label style={styles.row}>
          <span>Prix moyen (₩)</span>
          <input
            type="number"
            min="0"
            value={form.averagePriceKrw}
            onChange={(e) => set("averagePriceKrw", e.target.value)}
            style={styles.input}
            placeholder="12000"
          />
        </label>
      </div>

      {/* Créneau + réservation */}
      <div style={styles.grid}>
        <label style={styles.row}>
          <span>Créneau conseillé</span>
          <select
            value={form.suggestedTimeSlot}
            onChange={(e) => set("suggestedTimeSlot", e.target.value)}
            style={styles.input}
          >
            <option value="">—</option>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...styles.row, alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={!!form.reservationRequired}
            onChange={(e) => set("reservationRequired", e.target.checked)}
          />
          <span>Réservation nécessaire</span>
        </label>
      </div>

      {/* Notes */}
      <label style={styles.row}>
        <span>Notes</span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          style={styles.input}
          placeholder="Astuces, horaires, liens utiles…"
        />
      </label>

      {errors.length > 0 && (
        <p style={{ color: "#f87171", margin: 0 }}>{errors[0]}</p>
      )}

      {/* Boutons */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={submitting} style={styles.primaryBtn}>
          {submitting
            ? "Enregistrement…"
            : initial
            ? "Enregistrer"
            : "Ajouter au catalogue"}
        </button>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard
              .writeText(JSON.stringify(form, null, 2))
              .then(() => toast.success("Brouillon copié ✅"))
              .catch(() => toast.error("Copie impossible"))
          }
          style={styles.btnGhost}
        >
          Copier le brouillon
        </button>
      </div>
    </form>
  );
}

/** --- STYLES --- **/
const styles = {
  form: {
    display: "grid",
    gap: 12,
    background: "#11151e",
    border: "1px solid #1f2633",
    borderRadius: 16,
    padding: 16,
    color: "#e8ecf3",
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
  },
  row: { display: "grid", gap: 6 },
  grid: { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #1f2633",
    background: "#0f1420",
    color: "#e8ecf3",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  primaryBtn: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#22c55e",
    color: "#0b0e12",
    fontWeight: 800,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "transparent",
    color: "#e8ecf3",
    border: "1px solid #1f2633",
    cursor: "pointer",
  },
  actionsRight: {
    position: "absolute",
    right: 6,
    top: 6,
    display: "flex",
    gap: 6,
  },
  smallBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid #1f2633",
    background: "#0f1420",
    color: "#e8ecf3",
    cursor: "pointer",
  },
  infoDot: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    background: "#0f1420",
    border: "1px solid #1f2633",
    cursor: "pointer",
    opacity: 0.9,
  },
  hint: {
    position: "absolute",
    left: 0,
    top: "110%",
    zIndex: 10,
    width: 360,
    maxWidth: "90vw",
    background: "#0f1420",
    border: "1px solid #1f2633",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    boxShadow: "0 12px 24px rgba(0,0,0,.35)",
    wordBreak: "break-word",
  },
};
