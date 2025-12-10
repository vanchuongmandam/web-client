"use client";

import React from "react";
import { useZenMode } from "@/context/ZenModeContext";

interface ZenModeLayoutWrapperProps {
    children: React.ReactNode;
    header: React.ReactNode;
    footer: React.ReactNode;
}

export function ZenModeLayoutWrapper({
    children,
    header,
    footer,
}: ZenModeLayoutWrapperProps) {
    const { isZenMode } = useZenMode();

    return (
        <div className="flex flex-col min-h-screen transition-colors duration-300 ease-in-out">
            {!isZenMode && header}
            <main className={`flex-grow ${isZenMode ? "container mx-auto py-8 max-w-3xl" : ""}`}>
                {children}
            </main>
            {!isZenMode && footer}
        </div>
    );
}
