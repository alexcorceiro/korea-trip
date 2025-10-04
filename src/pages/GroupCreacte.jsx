import { useState } from "react";
import { useGroups } from "../hooks/useGroups";
import { Link, useNavigate } from "react-router-dom";

export default function GroupCreate(){
  const [name, setName] = useState("Séoul crew");
  const [res, setRes]   = useState(null);
  const [err, setErr]   = useState("");
  const nav = useNavigate();
  const { createGroup } = useGroups();

  const submit = async (e)=>{
    e.preventDefault(); setErr("");
    try{
      const out = await createGroup(name);
      setRes(out);
    }catch(e){ setErr(e.message); }
  };

  return (
    <main style={{maxWidth:480, margin:"0 auto", padding:16}}>
      <h2>Créer un groupe</h2>
      <form onSubmit={submit} style={{display:"grid", gap:8}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom du groupe"/>
        <button type="submit">Créer</button>
      </form>

      {res && (
        <div style={{marginTop:12}}>
          <p>Groupe créé ✅</p>
          <p><b>ID:</b> {res.groupId}<br/><b>Code d’invitation:</b> {res.code}</p>
          <button onClick={()=>nav(`/group/${res.groupId}`)}>Aller au planning</button>
        </div>
      )}
      {err && <p style={{color:"tomato"}}>{err}</p>}

      <p style={{marginTop:12}}><Link to="/">Retour</Link></p>
    </main>
  );
}
