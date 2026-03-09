"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

interface ZenModeContextType {
    isZenMode: boolean;
    toggleZenMode: () => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

export function ZenModeProvider({ children }: { children: React.ReactNode }) {
    const [isZenMode, setIsZenMode] = useState(false);

    useEffect(() => {
        if (isZenMode) {
            document.body.classList.add("zen-mode-active");
        } else {
            document.body.classList.remove("zen-mode-active");
        }
    }, [isZenMode]);

    const toggleZenMode = useCallback(() => setIsZenMode((prev) => !prev), []);

    const value = useMemo(() => ({ isZenMode, toggleZenMode }), [isZenMode, toggleZenMode]);

    return (
        <ZenModeContext.Provider value={value}>
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
