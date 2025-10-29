"use client";

import { createContext, ReactNode, useEffect, useState } from "react";

export const GoogleMapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isLoaded) return;

    if (typeof window.google !== "undefined") {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [isLoaded]);

  return <GoogleMapsContext.Provider value={{ isLoaded }}>{children}</GoogleMapsContext.Provider>;
}