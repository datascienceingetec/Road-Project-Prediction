"use client";
import { useEffect } from "react";

export default function AuthCheck() {
    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch("/api/v1/auth/me", {
                    method: "GET",
                    credentials: "include",
                });
                if (res.status === 401) {
                    // Don't redirect if we're already on auth callback
                    if (window.location.pathname.startsWith("/auth/callback"))
                        return;

                    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
                    const redirectUri = `${window.location.origin}/auth/callback`;
                    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
                        clientId || ""
                    )}&redirect_uri=${encodeURIComponent(
                        redirectUri
                    )}&response_type=code&scope=openid%20email%20profile&prompt=none`;
                    window.location.href = authUrl;
                }
            } catch (e) {
                console.error("Auth check failed", e);
            }
        };
        check();
    }, []);

    return null;
}
