import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthCtx } from "../context/AuthProvider";

export default function HeaderMobile({ title = "Planificateur Séoul" }) {
  const { user, logout } = useAuthCtx();
  const [openBurger, setOpenBurger] = useState(false);
  const [openAvatar, setOpenAvatar] = useState(false);

  const burgerRef = useRef(null);
  const avatarRef = useRef(null);

  const name = user?.displayName || user?.email || "Utilisateur";
  const initial = name.charAt(0).toUpperCase();

  // Fermer au clic dehors + touche ESC
  useEffect(() => {
    function onDocClick(e) {
      if (openBurger && burgerRef.current && !burgerRef.current.contains(e.target)) {
        setOpenBurger(false);
      }
      if (openAvatar && avatarRef.current && !avatarRef.current.contains(e.target)) {
        setOpenAvatar(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setOpenBurger(false);
        setOpenAvatar(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openBurger, openAvatar]);

  // Bloquer le scroll quand la sidebar est ouverte
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (openBurger) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [openBurger]);

  return (
    <header className="header safe" style={styles.headerGrid}>
      {/* Burger + Sidebar */}
      <div ref={burgerRef} style={{ position: "relative" }}>
        <button
          aria-label="Ouvrir le menu"
          aria-expanded={openBurger}
          onClick={() => setOpenBurger(v => !v)}
          style={styles.burger}
        >
          <span style={styles.bar} />
          <span style={styles.bar} />
          <span style={styles.bar} />
        </button>

        {/* Overlay plein écran */}
        {openBurger && (
          <div
            className="overlay"
            onClick={() => setOpenBurger(false)}
            style={styles.overlay}
          />
        )}

        {/* Sidebar fixe gauche */}
          <nav
          className={`sidebar ${openBurger ? "open" : ""}`}
          aria-hidden={!openBurger}
        >
          <div className="sidebar-header">
            <span>Menu</span>
            <button
              onClick={() => setOpenBurger(false)}
              style={{ background: "transparent", border: 0, color: "#e8ecf3", padding: 6, cursor: "pointer" }}
              aria-label="Fermer le menu"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-content">
            <ul className="side-list">
              <li><Link className="side-item" to="/" onClick={() => setOpenBurger(false)}>Accueil</Link></li>
              <li><Link className="side-item" to="/explore" onClick={() => setOpenBurger(false)}>Explorer</Link></li>
              <li><Link className="side-item" to="/planning" onClick={() => setOpenBurger(false)}>Planning</Link></li>
              <li className="side-divider" />
              <li><Link className="side-item" to="/catalog-add" onClick={() => setOpenBurger(false)}>Ajouter une activité</Link></li>
            </ul>
          </div>
</nav>
      </div>

      {/* Titre centré */}
      <h1 style={styles.title}>{title}</h1>

      {/* Avatar + menu */}
      <div ref={avatarRef} style={{ position: "relative", display: "grid", placeItems: "center" }}>
        <button
          aria-label="Menu profil"
          aria-expanded={openAvatar}
          onClick={() => setOpenAvatar(v => !v)}
          style={styles.avatar}
          title={name}
        >
          {initial}
        </button>

        {openAvatar && (
          <div className="avatar-menu" style={styles.avatarMenu}>
            <Link to="/profile" onClick={() => setOpenAvatar(false)} style={styles.avatarItem}>Profil</Link>
            <button onClick={logout} style={styles.avatarItem}>Déconnexion</button>
          </div>
        )}
      </div>
    </header>
  );
}

const styles = {
  headerGrid: {
    display: "grid",
    gridTemplateColumns: "52px 1fr 40px",
    alignItems: "center",
    gap: 8,
    padding: "1.2rem 5rem",
    color: "#e8ecf3",
  },
  burger: {
    width: 40, height: 40, borderRadius: 10,
    display: "grid", placeItems: "center",
    background: "#11151e", border: "1px solid #1f2633", cursor: "pointer"
  },
  bar: { display: "block", width: 18, height: 2, background: "#e8ecf3", margin: "2px 0" },
  title: { margin: 0, textAlign: "center", fontSize: 18, fontWeight: 800 },
  avatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#7dd3fc", color: "#0b0e12", fontWeight: 800,
    border: "none", cursor: "pointer"
  },

  /* Overlay + Sidebar */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 49
  },
  sidebar: {
    position: "fixed", top: 0, left: 0, bottom: 0,
    width: "78vw", maxWidth: 320, background: "#11151e",
    borderRight: "1px solid #1f2633", padding: 10, zIndex: 50,
    display: "grid", gap: 6, transition: "transform .24s ease"
  },
  item: {
    display: "block", textDecoration: "none", color: "#e8ecf3",
    background: "#0f1420", border: "1px solid #1f2633",
    borderRadius: 10, padding: "12px 14px"
  },

  /* Avatar menu */
  avatarMenu: {
    position: "absolute", top: 48, right: 0, minWidth: 220,
    background: "#11151e", border: "1px solid #1f2633",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)", zIndex: 60
  },
  avatarItem: {
    display: "block", width: "80%", textAlign: "left",
    padding: "12px 14px", color: "#e8ecf3",
    background: "transparent", border: "none",
    borderBottom: "1px solid #1f2633"
  }
};
