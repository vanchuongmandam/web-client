"use client";

import type { PublicProfile, MarketDocument } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Star, BookOpen, Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";

interface Props {
  profile: PublicProfile;
}

export function PublicProfileClient({ profile }: Props) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header / Cover */}
      <div className="relative mb-24">
        <div className="h-48 w-full rounded-xl bg-gradient-to-r from-primary/80 to-emerald-600/80 object-cover shadow-xs" />
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${profile.username}`} />
            <AvatarFallback className="text-4xl">{profile.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="mb-2">
            <h1 className="text-3xl font-black text-primary">{profile.displayName || profile.username}</h1>
            <p className="text-muted-foreground font-medium">@{profile.username}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Stats & Bio */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-xl shadow-xs">
            <CardContent className="p-6 space-y-6">
              {profile.bio ? (
                <div>
                  <h3 className="font-semibold mb-2">Giới thiệu</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Chưa có thông tin giới thiệu.</p>
              )}
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Tham gia: {format(new Date(profile.createdAt || Date.now()), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{profile.documents?.length || 0} tài liệu</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Documents List */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-6">Tài liệu đã xuất bản</h2>
          
          {!profile.documents || profile.documents.length === 0 ? (
            <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Tác giả này chưa xuất bản tài liệu nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {profile.documents.map((doc: MarketDocument) => (
                <Card key={doc._id} className="overflow-hidden rounded-xl flex flex-col group h-full shadow-xs hover:border-primary/50 transition-all">
                  <Link href={`/documents/${doc.slug}`} className="relative aspect-[4/3] block overflow-hidden bg-muted">
                    {doc.previewImages?.[0] ? (
                      <Image 
                        src={getMediaUrl(doc.previewImages[0])} 
                        alt={doc.title} 
                        fill 
                        className="object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                        <BookOpen className="h-10 w-10 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant={doc.isFree ? "default" : "destructive"} className="rounded-full text-xs font-semibold px-2 py-0.5">
                        {doc.isFree ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doc.price)}
                      </Badge>
                    </div>
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <Link href={`/documents/${doc.slug}`}>
                      <h3 className="font-bold text-sm line-clamp-2 hover:text-primary transition-colors" title={doc.title}>{doc.title}</h3>
                    </Link>
                    
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
                      <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {doc.viewCount || 0}</span>
                      <span className="flex items-center"><Star className="w-3 h-3 mr-1 text-amber-400" /> {doc.rating?.average?.toFixed(1) || '0.0'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
