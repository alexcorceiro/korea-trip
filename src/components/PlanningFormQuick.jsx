import { useState } from "react";

const CATS = ["Découverte","Culture","Food","Nightlife","Shopping","Nature","Expérience","Transport","Autre"];

export default function PlanningFormQuick({ defaultDate, onSubmit, submitting=false }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATS[0]);
  const [when, setWhen] = useState(defaultDate);
  const [err, setErr] = useState("");

  async function submit(e){
    e.preventDefault(); setErr("");
    try{
      await onSubmit({ title, category, when });
      setTitle("");
    }catch(e){ setErr(e.message || "Erreur"); }
  }

  return (
    <form onSubmit={submit} style={styles.form}>
      <input
        placeholder="Ex: Gwangjang Market"
        value={title}
        onChange={e=>setTitle(e.target.value)}
        style={styles.input}
        required
      />
      <div style={styles.row}>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={styles.input}>
          {CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={when} onChange={e=>setWhen(e.target.value)} style={styles.input}/>
      </div>
      {err && <p style={{color:"#f87171", margin:0}}>{err}</p>}
      <button type="submit" disabled={submitting} style={styles.btn}>
        {submitting ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}

const styles = {
  form:{ display:"grid", gap:8, background:"#11151e", border:"1px solid #1f2633", borderRadius:12, padding:12 },
  row:{ display:"grid", gap:8, gridTemplateColumns:"1fr 1fr" },
  input:{ padding:"10px 12px", borderRadius:10, border:"1px solid #1f2633", background:"#0f1420", color:"#e8ecf3" },
  btn:{ padding:12, borderRadius:10, background:"#22c55e", color:"#0b0e12", border:"none", fontWeight:800 }
};
