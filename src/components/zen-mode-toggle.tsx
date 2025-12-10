
"use client";

import React from "react";
import { useZenMode } from "@/context/ZenModeContext";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ZenModeToggle() {
    const { isZenMode, toggleZenMode } = useZenMode();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleZenMode}
                        className="rounded-full hover:bg-muted"
                        aria-label={isZenMode ? "Tắt Zen Mode" : "Bật Zen Mode"}
                    >
                        {isZenMode ? (
                            <Minimize2 className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Maximize2 className="h-5 w-5 text-muted-foreground" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isZenMode ? "Thoát chế độ tập trung" : "Chế độ tập trung (Zen Mode)"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
