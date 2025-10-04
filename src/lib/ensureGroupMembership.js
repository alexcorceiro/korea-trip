import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, DEFAULT_GROUP_ID } from "../firebase";

export async function ensureGroupMembership(user) {
  if (!user) return;
  const groupRef = doc(db, "groups", DEFAULT_GROUP_ID);

  // Crée le groupe s'il n'existe pas (idempotent grâce à merge: true)
  await setDoc(groupRef, {
    name: "Séoul – Groupe principal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Ajoute l'utilisateur dans members.{uid}
  await setDoc(groupRef, {
    members: {
      [user.uid]: {
        role: "member",
        joinedAt: serverTimestamp(),
        displayName: user.displayName || user.email || "Utilisateur",
      }
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
