"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [isLogout, setIsLogout] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const logout = params.get("logout");

        if (logout === "true") {
            setIsLogout(true);
            // router.replace("/login", { scroll: false });
            return;
        }

        // Construct the Google Authorization URL
        // Using "prompt=none" first to try silent authentication
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback`;

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId || "");
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "openid email profile");
        authUrl.searchParams.set("prompt", params.get("prompt") || "none");

        window.location.href = authUrl.toString();
    }, [router]);

    const handleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback`;

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId || "");
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "openid email profile");
        authUrl.searchParams.set("prompt", "select_account");

        window.location.href = authUrl.toString();
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            {/* Background Image with Overlay */}
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
                {isLogout ? (
                    <>
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                            <span className="material-symbols-outlined text-green-600 text-3xl">
                                check
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                            Sesión Cerrada
                        </h1>
                        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                            Has cerrado sesión exitosamente.
                        </p>
                        <button
                            onClick={handleLogin}
                            className="w-full bg-white text-gray-700 font-semibold py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 group"
                        >
                            <img
                                src="https://www.google.com/favicon.ico"
                                alt="Google"
                                className="w-5 h-5"
                            />
                            Iniciar Sesión con Google
                        </button>
                    </>
                ) : (
                    <>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                            Bienvenido
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Validando sesión...
                        </p>
                    </>
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
