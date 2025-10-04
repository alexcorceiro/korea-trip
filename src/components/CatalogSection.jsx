import { useMemo, useState } from "react";
import { useActivities } from "../hooks/useActivites";

export default function CatalogSection() {
  const { items, loading } = useActivities();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, 8); // limite courte en Home
    return items.filter(a =>
      (a.name || "").toLowerCase().includes(term) ||
      (a.category || "").toLowerCase().includes(term) ||
      (a.neighborhood || "").toLowerCase().includes(term)
    ).slice(0, 20);
  }, [q, items]);

  return (
    <section style={styles.card}>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <h3 style={{margin:"0 0 6px 0", flex:1}}>Catalogue</h3>
        <input
          placeholder="Rechercher…"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={styles.input}
        />
      </div>

      {loading ? <p>Chargement…</p> : (
        <div style={{display:"grid", gap:8}}>
          {filtered.map(a=>(
            <article key={a.id} style={styles.item}>
              <div style={{fontWeight:700}}>{a.name}</div>
              <div style={{opacity:.75, fontSize:12}}>
                {a.category}{a.neighborhood ? ` · ${a.neighborhood}` : ""}
              </div>
              <div style={{display:"flex", gap:8, marginTop:6}}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.googleQuery || a.name)}`}
                  target="_blank" rel="noreferrer"
                  style={styles.btnGhost}
                >
                  Maps
                </a>
              </div>
            </article>
          ))}
          {!filtered.length && <p style={{opacity:.7}}>Aucun résultat.</p>}
        </div>
      )}
    </section>
  );
}

const styles = {
  card:{ background:"#11151e", border:"1px solid #1f2633", borderRadius:14, padding:12 },
  input:{
    minWidth:120, padding:"8px 10px", borderRadius:10,
    border:"1px solid #1f2633", background:"#0f1420", color:"#e8ecf3", outline:"none"
  },
  item:{ background:"#0f1420", border:"1px solid #1f2633", borderRadius:12, padding:10 },
  btnGhost:{ padding:"8px 10px", borderRadius:10, border:"1px solid #374151", background:"#1f2937", color:"#e8ecf3", textDecoration:"none" }
};
