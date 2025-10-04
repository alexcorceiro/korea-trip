import { useMemo, useState, useRef } from "react";
import HeaderMobile from "../components/HeaderMobile";
import PlanningFormQuick from "../components/PlanningFormQuick";
import { usePlanning } from "../hooks/usePlanning";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";

const PERIODS = [
  { id: "morning",   label: "Matin" },
  { id: "afternoon", label: "Après-midi" },
  { id: "evening",   label: "Soir" },
  { id: "unsorted",  label: "Libre" },
];

export default function Planning(){
  const [date, setDate] = useState(toYMD(new Date()));
  const {
    items, loading,
    createItem, updateItem, toggleDone, moveTo, removeItem,
    reorder, bulkComplete, bulkMoveTo, bulkRemove,
    exportDay, importDay,
  } = usePlanning(date);

  const [q, setQ] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const [selected, setSelected] = useState(()=>new Set());
  const fileRef = useRef(null);

  const counts = useMemo(()=>{
    const done = items.filter(i=>i.done).length;
    return { done, total: items.length };
  },[items]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    return items.filter(i=>{
      if (hideDone && i.done) return false;
      if (!term) return true;
      const hay = `${i.title || ""} ${i.category || ""} ${i.note || ""}`.toLowerCase();
      return hay.includes(term);
    });
  },[items, q, hideDone]);

  const grouped = useMemo(()=>{
    const map = Object.fromEntries(PERIODS.map(p=>[p.id, []]));
    filtered.forEach(i=>{
      const k = PERIODS.find(p=>p.id === (i.period||"")) ? i.period : "unsorted";
      map[k].push(i);
    });
    return map;
  },[filtered]);

  // Sélection multiple
  const toggleSelect = (id)=>{
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const clearSelection = ()=> setSelected(new Set());

  // Drag & drop simple (réordre intra-période)
  const dnd = useRef({ period:null, ids:[] });
  const onDragStart = (period, id)=>{
    dnd.current = { period, ids: grouped[period].map(x=>x.id) };
  };
  const onDrop = async (period, targetId, draggedId)=>{
    if (period !== dnd.current.period) return;
    const arr = [...dnd.current.ids].filter(x=>x!==draggedId);
    const tIdx = arr.indexOf(targetId);
    if (tIdx === -1) return;
    arr.splice(tIdx, 0, draggedId);
    try{
      await (reorder?.(period, arr));
      toast.success("Ordre mis à jour");
    }catch{
      toast.error("Erreur lors du réordonnancement");
    }
  };

  // Navigation dates
  const prev = ()=> setDate(shift(date, -1));
  const next = ()=> setDate(shift(date, +1));
  const today = ()=> setDate(toYMD(new Date()));

  // Actions avec toasts
  async function handleCreate(base){
    try{
      await createItem(base);
      toast.success("Tâche ajoutée ✅");
    }catch(e){ toast.error(e.message || "Erreur lors de la création"); }
  }
  async function handleToggle(id, v){
    try{
      await toggleDone(id, v);
      toast(v ? "👍 Marquée comme faite" : "🔁 Remise à faire", { type:"info" });
    }catch{ toast.error("Impossible de changer l’état"); }
  }
  async function handleUpdate(id, patch){
    try{
      await (updateItem?.(id, patch));
      // toast.info("Enregistré"); // (optionnel, sinon trop verbeux)
    }catch{ toast.error("Sauvegarde impossible"); }
  }
  async function handleMove(id, newDate){
    try{
      await moveTo(id, newDate);
      toast.success(`Déplacée au ${newDate}`);
    }catch{ toast.error("Déplacement impossible"); }
  }
  async function handleRemove(id){
    try{
      await removeItem(id);
      toast.success("Tâche supprimée");
    }catch{ toast.error("Suppression impossible"); }
  }

  return (
    <div style={styles.app}>
      <HeaderMobile title="Planning" />
      <ToastContainer position="top-center" autoClose={1600} theme="dark" pauseOnHover={false} />

      <main style={styles.main}>
        {/* Barre de contrôle */}
        <motion.section
          style={{ ...styles.card, ...styles.tools }}
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.18 }}
        >
          <div style={styles.row}>
            <div style={{ display:"flex", gap:6 }}>
              <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={prev}>◀︎</motion.button>
              <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={today}>Aujourd’hui</motion.button>
              <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={next}>▶︎</motion.button>
            </div>

            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={styles.input} />

            <div style={{ textAlign:"right" }}>
              <div style={styles.kicker}>Terminées</div>
              <div style={{ fontWeight:800 }}>{counts.done} / {counts.total}</div>
            </div>
          </div>

          <div style={{ ...styles.row, marginTop:8, gap:8 }}>
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Rechercher une tâche…"
              style={{ ...styles.input, flex:1 }}
            />
            <label style={styles.label}>
              <input type="checkbox" checked={hideDone} onChange={e=>setHideDone(e.target.checked)} /> Masquer terminées
            </label>
            <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={async ()=>{
              try{
                const json = await (exportDay?.() ?? Promise.resolve({ items, date }));
                const blob = new Blob([JSON.stringify(json,null,2)], { type:"application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `planning-${date}.json`; a.click();
                URL.revokeObjectURL(url);
                toast.success("Exporté ✅");
              }catch{ toast.error("Export impossible"); }
            }}>Exporter</motion.button>

            <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={()=>fileRef.current?.click()}>Importer</motion.button>
            <input
              ref={fileRef} type="file" accept="application/json" style={{ display:"none" }}
              onChange={async (e)=>{
                const f = e.target.files?.[0]; if(!f) return;
                try{
                  const text = await f.text();
                  await importDay?.(JSON.parse(text));
                  toast.success("Import réussi ✅");
                }catch{ toast.error("Fichier invalide ❌"); }
                e.target.value = "";
              }}
            />
          </div>
        </motion.section>

        {/* Formulaire rapide */}
        <PlanningFormQuick defaultDate={date} onSubmit={handleCreate} />

        {/* Barre multi-sélection */}
        <AnimatePresence>
          {selected.size>0 && (
            <motion.section
              style={{ ...styles.card, ...styles.selectionBar }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
            >
              <div>{selected.size} sélectionnée{selected.size>1?"s":""}</div>
              <div style={{ display:"flex", gap:8 }}>
                <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={async()=>{
                  await bulkComplete?.(Array.from(selected), true);
                  clearSelection(); toast("Marquées faites", { type:"info" });
                }}>Marquer fait</motion.button>

                <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={async()=>{
                  await bulkComplete?.(Array.from(selected), false);
                  clearSelection(); toast("Remises à faire", { type:"info" });
                }}>Marquer à faire</motion.button>

                <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={async()=>{
                  await bulkMoveTo?.(Array.from(selected), shift(date,+1));
                  clearSelection(); toast.success("Déplacées à demain");
                }}>Reporter +1j</motion.button>

                <motion.button whileTap={{ scale:.98 }} style={{ ...styles.btnGhost, borderColor:"#ef4444", color:"#ef4444" }} onClick={async()=>{
                  await bulkRemove?.(Array.from(selected));
                  clearSelection(); toast.success("Supprimées");
                }}>Supprimer</motion.button>

                <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={clearSelection}>Annuler</motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Listes par période */}
        {loading ? (
          <section style={styles.card}><p style={styles.muted}>Chargement…</p></section>
        ) : (
          PERIODS.map(period=>(
            <motion.section
              key={period.id}
              style={styles.card}
              initial={{ opacity:0, y:8 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:.2 }}
              transition={{ duration:.18 }}
            >
              <div style={styles.row}>
                <h3 style={styles.h3}>{period.label}</h3>
                <div style={{ display:"flex", gap:6 }}>
                  <motion.button
                    whileTap={{ scale:.98 }}
                    style={styles.btnGhost}
                    onClick={()=>handleCreate({ title:`Nouvelle tâche (${period.label})`, category:"", date, period:period.id })}
                  >+ Ajouter ici</motion.button>
                </div>
              </div>

              {grouped[period.id].length===0 ? (
                <p style={styles.muted}>Rien ici pour l’instant.</p>
              ) : (
                <div>
                  {grouped[period.id].map((it)=>(
                    <motion.div key={it.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}>
                      <TaskRow
                        item={it}
                        onToggle={(v)=>handleToggle(it.id, v)}
                        onChange={(patch)=>handleUpdate(it.id, patch)}
                        onMove={(d)=>handleMove(it.id, d)}
                        onDuplicate={()=>handleCreate({ ...it, id:undefined, done:false, date })}
                        onRemove={()=>handleRemove(it.id)}
                        onAssignPeriod={(p)=>handleUpdate(it.id, { period:p })}
                        selected={selected.has(it.id)}
                        onSelect={()=>toggleSelect(it.id)}
                        draggable
                        onDragStart={()=>onDragStart(period.id, it.id)}
                        onDragOver={(e)=>e.preventDefault()}
                        onDrop={()=>onDrop(period.id, it.id, it.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          ))
        )}
      </main>
    </div>
  );
}

/* ---- Ligne de tâche ---- */
function TaskRow({
  item, onToggle, onChange, onMove, onDuplicate, onRemove, onAssignPeriod,
  selected, onSelect, draggable, onDragStart, onDragOver, onDrop
}){
  return (
    <div
      style={styles.item}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <label style={{ display:"flex", alignItems:"center", gap:10 }}>
        <input type="checkbox" checked={!!item.done} onChange={(e)=>onToggle(e.target.checked)} />
        <input
          value={item.title || ""}
          onChange={(e)=>onChange?.({ title:e.target.value })}
          style={{ ...styles.inputGhost, textDecoration: item.done ? "line-through":"none", width:"min(58vw, 360px)" }}
          placeholder="Titre…"
        />
      </label>

      <div style={{ display:"flex", gap:6, alignItems:"center", marginLeft:"auto" }}>
        <select value={item.category || ""} onChange={(e)=>onChange?.({ category:e.target.value })} style={styles.selectSm}>
          <option value="">Catégorie…</option>
          <option>Découverte</option><option>Culture</option><option>Food</option>
          <option>Nightlife</option><option>Shopping</option><option>Nature</option>
          <option>Expérience</option><option>Transport</option><option>Autre</option>
        </select>

        <input type="time" value={item.time || ""} onChange={(e)=>onChange?.({ time:e.target.value })} style={styles.selectSm} />

        <select value={item.period || "unsorted"} onChange={(e)=>onAssignPeriod?.(e.target.value)} style={styles.selectSm}>
          {PERIODS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
        </select>

        <details>
          <summary style={styles.btnGhost}>Note</summary>
          <textarea
            value={item.note || ""} onChange={(e)=>onChange?.({ note:e.target.value })}
            rows={3} style={styles.textarea} placeholder="Précision, adresse, budget…"
          />
        </details>

        <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={()=>onMove(shift(item.date,+1))}>+1j</motion.button>
        <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={()=>onMove(shift(item.date,-1))}>-1j</motion.button>
        <motion.button whileTap={{ scale:.98 }} style={styles.btnGhost} onClick={onDuplicate}>Dupliquer</motion.button>
        <motion.button whileTap={{ scale:.98 }} style={{ ...styles.btnGhost, borderColor:"#ef4444", color:"#ef4444" }} onClick={onRemove}>Suppr.</motion.button>

        {/* Sélection multiple */}
        <label title="Sélection multiple">
          <input type="checkbox" checked={selected} onChange={onSelect} />
        </label>
      </div>
    </div>
  );
}

/* ---- Helpers & styles ---- */
const toYMD = (d)=> new Date(d).toISOString().slice(0,10);
const shift = (ymd, days)=>{
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate()+days);
  return toYMD(d);
};

const styles = {
  app:{ minHeight:"100dvh", background:"#0b0e12", color:"#e8ecf3", paddingBottom:80 },
  main:{ width:"77%", margin:" auto", padding:12, display:"grid", gap:20 , marginTop: 30},

  tools:{ position:"sticky", top:56, zIndex:10 },

  card:{
    width:"100%", maxWidth:"100%", margin:"0 auto",
    background:"#11151e", border:"1px solid #1f2633", borderRadius:16, padding:14,
    boxShadow:"0 6px 18px rgba(0,0,0,.25)", boxSizing:"border-box",
  },
  row:{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 },
  h3:{ margin:0, fontSize:16, fontWeight:800 },
  kicker:{ opacity:.7, fontSize:12 },
  muted:{ opacity:.75, fontSize:14, margin:0 },

  input:{ padding:"10px 12px", borderRadius:10, border:"1px solid #1f2633", background:"#0f1420", color:"#e8ecf3", outline:"none" },
  inputGhost:{ padding:"6px 8px", borderRadius:8, border:"1px solid #1f2633", background:"#0f1420", color:"#e8ecf3", outline:"none" },
  selectSm:{ height:34, padding:"0 8px", borderRadius:8, background:"#0f1420", border:"1px solid #1f2633", color:"#e8ecf3" },
  textarea:{ width:"min(78vw, 520px)", marginTop:8, borderRadius:10, border:"1px solid #1f2633", background:"#0f1420", color:"#e8ecf3", padding:10, outline:"none" },

  item:{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1f2633" },
  btnGhost:{ padding:"8px 10px", borderRadius:10, border:"1px solid #374151", background:"transparent", color:"#e8ecf3", cursor:"pointer" },

  selectionBar:{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 },
};
