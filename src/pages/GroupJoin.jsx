import { useState } from "react";
import { useGroups } from "../hooks/useGroups";
import { Link, useNavigate } from "react-router-dom";

export default function GroupJoin(){
  const [code, setCode] = useState("");
  const [err, setErr]   = useState("");
  const nav = useNavigate();
  const { joinGroupByCode } = useGroups();

  const submit = async (e)=>{
    e.preventDefault(); setErr("");
    try{
      const groupId = await joinGroupByCode(code.trim().toUpperCase());
      nav(`/group/${groupId}`);
    }catch(e){ setErr(e.message); }
  };

  return (
    <main style={{maxWidth:480, margin:"0 auto", padding:16}}>
      <h2>Rejoindre un groupe</h2>
      <form onSubmit={submit} style={{display:"grid", gap:8}}>
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code d'invitation (6 lettres)"/>
        <button type="submit">Rejoindre</button>
      </form>
      {err && <p style={{color:"tomato"}}>{err}</p>}
      <p style={{marginTop:12}}><Link to="/">Retour</Link></p>
    </main>
  );
}
