"use client";

import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Quote, Download, Image as ImageIcon, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface QuoteCardGeneratorProps {
    initialText?: string;
    author?: string;
}

export function QuoteCardGenerator({ initialText = "", author = "Văn Chương Mạn Đàm" }: QuoteCardGeneratorProps) {
    const [text, setText] = useState(initialText);
    const [customAuthor, setCustomAuthor] = useState(author);
    const cardRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'paper'>('paper');

    const handleDownload = async () => {
        if (cardRef.current) {
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: null,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `quote-${Date.now()}.png`;
            link.click();
        }
    };

    const themes = {
        light: "bg-white text-gray-900 border-gray-200",
        dark: "bg-slate-900 text-white border-slate-800",
        paper: "bg-[#fdfbf7] text-[#4a4a4a] border-[#e6e1d5] bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]",
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Quote className="h-4 w-4" />
                    <span>Tạo trích dẫn</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tạo thẻ trích dẫn (Quote Card)</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Nội dung</label>
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="mt-1 h-32"
                                placeholder="Nhập câu trích dẫn..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tác giả / Nguồn</label>
                            <input
                                value={customAuthor}
                                onChange={(e) => setCustomAuthor(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Giao diện</label>
                            <div className="flex gap-2">
                                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} size="sm">Sáng</Button>
                                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} size="sm">Tối</Button>
                                <Button variant={theme === 'paper' ? 'default' : 'outline'} onClick={() => setTheme('paper')} size="sm">Giấy</Button>
                            </div>
                        </div>

                        <Button onClick={handleDownload} className="w-full gap-2">
                            <Download className="h-4 w-4" /> Tải ảnh về
                        </Button>
                    </div>

                    <div className="flex items-center justify-center bg-gray-100 p-4 rounded-lg overflow-hidden relative">
                        <div
                            ref={cardRef}
                            className={`p-8 w-[350px] aspect-[4/5] flex flex-col justify-between shadow-xl ${themes[theme]} relative transition-colors`}
                        >
                            <div className="absolute top-4 left-4 opacity-20">
                                <Quote className="h-8 w-8" />
                            </div>

                            <div className="flex-grow flex items-center justify-center">
                                <p className={`font-serif text-xl md:text-2xl italic leading-relaxed text-center font-medium`}>
                                    {text || "Nội dung trích dẫn sẽ hiện ở đây..."}
                                </p>
                            </div>

                            <div className="mt-6 text-center">
                                <div className="w-12 h-1 bg-current opacity-30 mx-auto mb-3"></div>
                                <p className="uppercase text-xs tracking-widest font-semibold opacity-70">
                                    {customAuthor}
                                </p>
                            </div>

                            <div className="absolute bottom-2 right-2 text-[10px] opacity-40">
                                vanchuongmandam
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
