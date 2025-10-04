import { useParams } from "react-router-dom";
import { usePlanner } from "../hooks/usePlanner";
import { useState } from "react";

export default function Planner(){
  const { groupId } = useParams();
  const { todos, addTodo, toggleTodo, removeTodo, activities, addActivity, removeActivity } = usePlanner(groupId, "default");
  const [title, setTitle] = useState("");
  const [actName, setActName] = useState("");

  return (
    <main style={{maxWidth:900, margin:"0 auto", padding:16}}>
      <h2>Planning du groupe {groupId}</h2>

      <section style={{margin:"16px 0"}}>
        <h3>Todo</h3>
        <div style={{display:"flex", gap:8}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nouvelle tâche"/>
          <button onClick={()=>{ if(title.trim()) { addTodo(title.trim()); setTitle(""); } }}>Ajouter</button>
        </div>
        <ul style={{listStyle:"none", padding:0}}>
          {todos.map(t=>(
            <li key={t.id} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 0"}}>
              <input type="checkbox" checked={!!t.done} onChange={e=>toggleTodo(t.id, e.target.checked)} />
              <span style={{textDecoration: t.done ? "line-through" : "none"}}>{t.title}</span>
              <button style={{marginLeft:"auto"}} onClick={()=>removeTodo(t.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{margin:"16px 0"}}>
        <h3>Activités</h3>
        <div style={{display:"flex", gap:8}}>
          <input value={actName} onChange={e=>setActName(e.target.value)} placeholder="Ajouter une activité (ex: Gwangjang)"/>
          <button onClick={()=>{ if(actName.trim()){ addActivity({ name: actName.trim(), category: "Découverte" }); setActName(""); }}}>Ajouter</button>
        </div>
        <ul style={{listStyle:"none", padding:0}}>
          {activities.map(a=>(
            <li key={a.id} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 0"}}>
              <span>{a.name} <small style={{opacity:.7}}>({a.category||"—"})</small></span>
              <button style={{marginLeft:"auto"}} onClick={()=>removeActivity(a.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
