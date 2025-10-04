import { Link } from "react-router-dom";
import { useGroups } from "../hooks/useGroups";
import { useAuthCtx } from "../context/AuthProvider";
import { useState } from "react";

export default function Dashboard(){
  const { user, logout } = useAuthCtx();
  const { currentGroup } = useGroups();
  const [code, setCode] = useState("");

  return (
    <main style={{maxWidth:720, margin:"0 auto", padding:16}}>
      <h1>Bienvenue {user?.displayName || user?.email}</h1>

      <div style={{display:"flex", gap:8, margin:"12px 0"}}>
        <Link to="/group/create"><button>Créer un groupe</button></Link>
        <Link to="/group/join"><button>Rejoindre un groupe</button></Link>
        {currentGroup && <Link to={`/group/${currentGroup}`}><button>Ouvrir le planning</button></Link>}
        <button onClick={logout} style={{marginLeft:"auto"}}>Se déconnecter</button>
      </div>
    </main>
  );
}
