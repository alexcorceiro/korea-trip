// src/hooks/useActivites.js
import { useEffect, useMemo, useState } from "react";
import {
  collection, addDoc, doc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy, where,
  updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuthCtx } from "../context/AuthProvider";
import { PATHS } from "../config/paths";

const PATH = PATHS.activities; // ✅ catalogue commun: "groups/main/activities"

export function useActivities() {
  const { user } = useAuthCtx();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = useMemo(() => collection(db, PATH), []);

  useEffect(() => {
    setLoading(true);
    const q = query(colRef, orderBy("name"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [colRef]);

  function validate(d) {
    if (!d.name || d.name.trim().length < 2)
      return "Le nom est requis (≥ 2 caractères).";
    if (!d.category)
      return "La catégorie est requise.";
    if (d.rating != null && (Number(d.rating) < 0 || Number(d.rating) > 5))
      return "Note 0–5.";
    if (d.averagePriceKrw != null && Number(d.averagePriceKrw) < 0)
      return "Prix moyen invalide.";
    // ⛔️ on ne valide plus durationMin (retiré de la logique)
    return "";
  }

  async function createActivity(data) {
    const err = validate(data);
    if (err) throw new Error(err);
    if (!user?.uid) throw new Error("Connecte-toi pour créer une activité.");

    const payload = {
      name: (data.name || "").trim(),
      category: data.category || "",
      neighborhood: (data.neighborhood || "").trim(),
      address: (data.address || "").trim(),
      image: (data.image || "").trim(),
      // 🔗 mapsLink: accepte soit une URL Google Maps complète, soit une requête libre
      mapsLink: (data.mapsLink || data.googleQuery || data.name || "").trim(),
      rating: data.rating === "" || data.rating == null ? null : Number(data.rating),
      averagePriceKrw:
        data.averagePriceKrw === "" || data.averagePriceKrw == null
          ? null
          : Number(data.averagePriceKrw),
      reservationRequired: !!data.reservationRequired,
      suggestedTimeSlot: data.suggestedTimeSlot || "",
      // ⛔️ durationMin retiré
      notes: (data.notes || "").trim(),

      // sociaux / audit
      createBy: user.uid,
      createByName: user.displayName || user.email || "Utilisateur",
      favoritesUser: [],

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(colRef, payload);
    return ref.id;
  }

  async function updateActivity(id, patch) {
    // nettoyage: on supprime durationMin si présent dans le patch
    const { durationMin, ...rest } = patch || {};
    await setDoc(
      doc(db, PATH, id),
      { ...rest, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function removeActivity(id) {
    await deleteDoc(doc(db, PATH, id));
  }

  // Helpers favoris
  async function addFavorite(id, uid) {
    if (!uid) throw new Error("UID requis pour favoris");
    await updateDoc(doc(db, PATH, id), {
      favoritesUser: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
  }

  async function removeFavorite(id, uid) {
    if (!uid) throw new Error("UID requis pour favoris");
    await updateDoc(doc(db, PATH, id), {
      favoritesUser: arrayRemove(uid),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * toggleFavorite : garde compatibilité avec ton code existant
   * (déduit fav / pas fav depuis l’état local `items`)
   */
  async function toggleFavorite(id) {
    if (!user?.uid) throw new Error("Connecte-toi pour gérer tes favoris.");
    const isFav = items.find((x) => x.id === id)?.favoritesUser?.includes(user.uid);
    if (isFav) await removeFavorite(id, user.uid);
    else await addFavorite(id, user.uid);
  }

  return {
    items,
    loading,
    createActivity,
    updateActivity,
    removeActivity,
    toggleFavorite,  // compat
    addFavorite,     // pour usage direct si besoin
    removeFavorite,  // idem
  };
}

/* === Hooks filtrés pour le Profil === */

// Mes activités créées
export function useMyCreatedActivities(uid) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const colRef = collection(db, PATH);
    const qy = query(colRef, where("createBy", "==", uid), orderBy("name"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [uid]);

  return { items, loading };
}

// Mes favoris
export function useMyFavoriteActivities(uid) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const colRef = collection(db, PATH);
    const qy = query(colRef, where("favoritesUser", "array-contains", uid), orderBy("name"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [uid]);

  return { items, loading };
}
