"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ZenModeContextType {
    isZenMode: boolean;
    toggleZenMode: () => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

export function ZenModeProvider({ children }: { children: React.ReactNode }) {
    const [isZenMode, setIsZenMode] = useState(false);

    // Optional: Persist to localStorage
    useEffect(() => {
        const saved = localStorage.getItem("zen-mode");
        if (saved === "true") setIsZenMode(true);
    }, []);

    useEffect(() => {
        localStorage.setItem("zen-mode", String(isZenMode));
        if (isZenMode) {
            document.body.classList.add("zen-mode-active");
        } else {
            document.body.classList.remove("zen-mode-active");
        }
    }, [isZenMode]);

    const toggleZenMode = () => setIsZenMode((prev) => !prev);

    return (
        <ZenModeContext.Provider value={{ isZenMode, toggleZenMode }}>
            {children}
        </ZenModeContext.Provider>
    );
}

export function useZenMode() {
    const context = useContext(ZenModeContext);
    if (context === undefined) {
        throw new Error("useZenMode must be used within a ZenModeProvider");
    }
    return context;
}
