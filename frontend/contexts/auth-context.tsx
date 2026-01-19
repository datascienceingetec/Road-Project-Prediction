"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
    employeeID: string;
    employeeName: string;
    employeeLastName: string;
    employeeCategorie: string;
    employeeDepartment: string;
    employeeMail: string;
    employeePicture: string;
}

interface Session {
    sub: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkAuth = async () => {
        try {
            setLoading(true);
            const { user, session } = await api.getMe();
            setUser(user);
            setSession(session);
        } catch (e) {
            setUser(null);
            setSession(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.logout();
            setUser(null);
            router.push("/");
            window.location.href = "/login?logout=true";
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                logout,
                checkAuth,
                setUser,
                setSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
