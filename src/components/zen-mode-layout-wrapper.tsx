"use client";

import React from "react";
import { useZenMode } from "@/context/ZenModeContext";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();
    
    // Ẩn Header/Footer khi đang ở Zen Mode hoặc trong khu vực Admin Dashboard
    const isAdmin = pathname?.startsWith("/admin");
    const showHeaderFooter = !isZenMode && !isAdmin;

    return (
        <div className="flex flex-col min-h-screen transition-colors duration-300 ease-in-out">
            {showHeaderFooter && header}
            <main className={`flex-grow ${isZenMode ? "container mx-auto py-8 max-w-3xl" : ""}`}>
                {children}
            </main>
            {showHeaderFooter && footer}
        </div>
    );
}
