// src/hooks/usePlanning.js
import { useEffect, useMemo, useState } from "react";
import {
  collection, addDoc, doc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy, where
} from "firebase/firestore";
import { db } from "../firebase";
import { PATHS } from "../config/paths";

// Format YYYY-MM-DD exporté (≠ toYMD)
export const ymd = (d = new Date()) => d.toISOString().slice(0, 10);

// Collection du planning partagé
const COL = PATHS.planning;

export function usePlanning(selectedYmd = ymd()) {
  const [items, setItems] = useState([]);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = useMemo(() => collection(db, COL), []);

  // flux en temps réel pour la date sélectionnée
  useEffect(() => {
    setLoading(true);
    const q = query(
      colRef,
      where("when", "==", selectedYmd || null),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [colRef, selectedYmd]);

  // mini flux pour aujourd’hui (aperçu Home)
  useEffect(() => {
    const q = query(
      colRef,
      where("when", "==", ymd()),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setToday(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [colRef]);

  // validations
  function validate(d) {
    if (!d.title || d.title.trim().length < 2)
      return "Le titre est requis (≥ 2 caractères).";
    if (d.when && !/^\d{4}-\d{2}-\d{2}$/.test(d.when))
      return "Format de date invalide (YYYY-MM-DD).";
    return "";
  }

  async function createItem(data) {
    const err = validate(data);
    if (err) throw new Error(err);
    const payload = {
      title: data.title.trim(),
      category: data.category || "",
      when: data.when || ymd(), // par défaut aujourd’hui
      done: !!data.done,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(colRef, payload);
    return ref.id;
  }

  async function updateItem(id, patch) {
    await setDoc(
      doc(db, COL, id),
      { ...patch, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function toggleDone(id, next) {
    await setDoc(
      doc(db, COL, id),
      { done: !!next, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function moveTo(id, newYmd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newYmd)) throw new Error("Date invalide");
    await setDoc(
      doc(db, COL, id),
      { when: newYmd, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, COL, id));
  }

  return {
    items,
    today,
    loading,
    createItem,
    updateItem,
    toggleDone,
    moveTo,
    removeItem,
    ymd,
  };
}
