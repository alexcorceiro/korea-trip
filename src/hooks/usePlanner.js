import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection, addDoc, doc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";

export function usePlanner(groupId, planId = "default"){
  const [todos, setTodos] = useState([]);
  const [activities, setActivities] = useState([]);

  // Live todos
  useEffect(()=>{
    if(!groupId) return;
    const q = query(collection(db, "groups", groupId, "plans", planId, "todos"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{
      setTodos(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });
    return unsub;
  },[groupId, planId]);

  // Live activities
  useEffect(()=>{
    if(!groupId) return;
    const q = query(collection(db, "groups", groupId, "plans", planId, "activities"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{
      setActivities(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });
    return unsub;
  },[groupId, planId]);

  // CRUD
  const addTodo = (title, category="Découverte") =>
    addDoc(collection(db, "groups", groupId, "plans", planId, "todos"), {
      title, category, done:false, createdAt: serverTimestamp()
    });

  const toggleTodo = (id, done) =>
    updateDoc(doc(db, "groups", groupId, "plans", planId, "todos", id), { done });

  const removeTodo = (id) =>
    deleteDoc(doc(db, "groups", groupId, "plans", planId, "todos", id));

  const addActivity = (payload) =>
    addDoc(collection(db, "groups", groupId, "plans", planId, "activities"), {
      ...payload,
      createdAt: serverTimestamp()
    });

  const updateActivity = (id, patch) =>
    updateDoc(doc(db, "groups", groupId, "plans", planId, "activities", id), patch);

  const removeActivity = (id) =>
    deleteDoc(doc(db, "groups", groupId, "plans", planId, "activities", id));

  return {
    todos, addTodo, toggleTodo, removeTodo,
    activities, addActivity, updateActivity, removeActivity
  };
}
