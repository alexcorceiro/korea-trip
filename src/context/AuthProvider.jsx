import { createContext, useContext, useEffect,useState } from "react";
import{auth} from "../firebase";
import {onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext(null)


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [laoding, setLaoding ] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u || null);
            setLaoding(false)
        });
        return unsub
    },[]);

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{user, laoding, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthCtx = () => useContext(AuthContext);