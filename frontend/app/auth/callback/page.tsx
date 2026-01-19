"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api, APIError } from "@/lib/api";

import { useAuth } from "@/contexts/auth-context";

export default function CallbackPage() {
    const router = useRouter();
    const { setUser, setSession } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const doAuth = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const errorParam = params.get("error");

                if (
                    errorParam === "interaction_required" ||
                    errorParam === "login_required" ||
                    errorParam === "consent_required"
                ) {
                    router.replace("/login?prompt=select_account");
                    return;
                }

                const code = params.get("code");
                if (!code) throw new Error("No code found");

                const { user, session } = await api.authGoogle(code);

                setUser(user);
                setSession(session);

                router.replace("/");
            } catch (e: any) {
                if (e instanceof APIError && e.status === 403) {
                    setError(
                        "No tienes permisos para acceder a esta aplicación"
                    );
                } else {
                    setError("Error al autenticarse");
                }
                window.history.replaceState({}, "", "/auth/callback");
            }
        };

        doAuth();
    }, [router, setUser, setSession]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url('https://www.ingetec.com.co/static/images/areas/infra/bogVill01.jpg')",
                }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>

            <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-white/20 p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                {/* Logo Section */}
                <div className="mb-6">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto shadow-inner">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            {error ? "gpp_bad" : "admin_panel_settings"}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {error ? "Acceso Denegado" : "Autenticando"}
                    </h1>
                </div>

                {!error ? (
                    <div className="flex flex-col items-center space-y-4 py-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div>
                        </div>
                        <p className="text-gray-600 font-medium">
                            Verificando credenciales...
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 w-full shadow-sm">
                            <p className="font-semibold flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-lg">
                                    error
                                </span>
                                {error}
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Si consideras que esto es un error, por favor
                            contacta al administrador.
                        </p>
                        <button
                            onClick={() => {
                                window.history.replaceState({}, "", "/");
                                window.location.href =
                                    "https://gestiona.ingetec.com.co/gestiona/#/pages/login-boxed";
                            }}
                            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 font-semibold w-full flex items-center justify-center gap-2 group"
                        >
                            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                                login
                            </span>
                            Ir a Gestiona
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200/60 w-full text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        INGETEC &copy; 2026 &middot; Road Project Prediction
                    </p>
                </div>
            </div>
        </div>
    );
}
