import { Navigate } from "react-router-dom";
import { useAuthCtx } from "../context/AuthProvider";

export default function ProtectedRoute ({children}) {
    const {user, loading } = useAuthCtx()
    if (loading) return <div style={{padding:16}}>Chargement...</div>
    if(!user) return <Navigate to="/login" replace />
    return children;
}