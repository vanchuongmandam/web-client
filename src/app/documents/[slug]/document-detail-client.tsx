// src/app/documents/[slug]/document-detail-client.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { checkDocumentOwnership, getDocumentDownload } from '@/lib/api';
import type { MarketDocument } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Star, Eye, Download, ShoppingCart,
  ArrowLeft, BookOpen, Tag, Calendar,
} from 'lucide-react';

function formatPrice(price: number): string {
  if (price === 0) return 'Mien phi';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

interface Props {
  document: MarketDocument;
}

export function DocumentDetailClient({ document: doc }: Props) {
  const { user, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [owned, setOwned] = useState(false);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token && doc._id) {
      checkDocumentOwnership(doc._id, token)
        .then((res) => setOwned(res.owned))
        .catch(() => setOwned(false))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [token, doc._id]);

  const handleDownload = async () => {
    if (!token) return router.push('/login');
    setDownloading(true);
    try {
      const info = await getDocumentDownload(doc._id, token);
      window.open(info.downloadUrl, '_blank');
    } catch (err: unknown) {
      toast({
        title: 'Loi',
        description: err instanceof Error ? err.message : 'Khong the tai tai lieu',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleBuy = () => {
    if (!token) return router.push('/login');
    router.push(`/documents/${doc.slug}/checkout`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/documents" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Quay lai kho tai lieu
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Preview images */}
          {doc.previewImages && doc.previewImages.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-lg">
              <img
                src={doc.previewImages[0]}
                alt={doc.title}
                className="w-full object-cover"
              />
              {doc.previewImages.length > 1 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {doc.previewImages.slice(1).map((img, i) => (
                    <img key={i} src={img} alt={`Preview ${i + 2}`} className="rounded-md object-cover aspect-square" />
                  ))}
                </div>
              )}
            </div>
          )}

          <h1 className="text-3xl font-bold">{doc.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {doc.category && (
              <Badge variant="secondary">{doc.category.name}</Badge>
            )}
            {doc.featured && <Badge>Noi bat</Badge>}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> {doc.author}
            </span>
          </div>

          <Separator className="my-6" />

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-3">Mo ta</h2>
            <p className="whitespace-pre-line text-muted-foreground">{doc.description}</p>
          </div>

          {doc.tags && doc.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Tag className="h-4 w-4" /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Purchase Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="mb-4 text-center">
                {doc.originalPrice && doc.originalPrice > doc.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(doc.originalPrice)}
                  </span>
                )}
                <div className={`text-3xl font-bold ${doc.isFree ? 'text-green-600' : ''}`}>
                  {formatPrice(doc.price)}
                </div>
              </div>

              {owned ? (
                <Button className="w-full" size="lg" onClick={handleDownload} disabled={downloading}>
                  <Download className="mr-2 h-5 w-5" />
                  {downloading ? 'Dang tai...' : 'Tai tai lieu'}
                </Button>
              ) : doc.isFree ? (
                <Button className="w-full" size="lg" onClick={handleBuy}>
                  <Download className="mr-2 h-5 w-5" />
                  Nhan mien phi
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleBuy}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Mua tai lieu
                </Button>
              )}

              <Separator className="my-4" />

              {/* Document details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dinh dang</span>
                  <span className="font-medium uppercase">{doc.fileFormat}</span>
                </div>
                {doc.pageCount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">So trang</span>
                    <span className="font-medium">{doc.pageCount}</span>
                  </div>
                )}
                {doc.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kich thuoc</span>
                    <span className="font-medium">{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Luot xem</span>
                  <span className="font-medium flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {doc.viewCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Da mua</span>
                  <span className="font-medium flex items-center gap-1">
                    <Download className="h-3 w-3" /> {doc.purchaseCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Danh gia</span>
                  <span className="font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {doc.rating.average > 0 ? `${doc.rating.average.toFixed(1)} (${doc.rating.count})` : 'Chua co'}
                  </span>
                </div>
              </div>

              {doc.relatedArticle && (
                <>
                  <Separator className="my-4" />
                  <Link
                    href={`/articles/${doc.relatedArticle.slug}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="h-4 w-4" />
                    Doc bai viet lien quan
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
