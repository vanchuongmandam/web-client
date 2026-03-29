// src/app/documents/[slug]/checkout/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getDocumentBySlug, getProfile, updateProfile, createOrder, getOrderByCode,
} from '@/lib/api';
import type { MarketDocument, Order, BillingAddress, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, CheckCircle, Clock, Loader2, QrCode, CreditCard,
} from 'lucide-react';

function formatPrice(price: number): string {
  if (price === 0) return 'Mien phi';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

type Step = 'billing' | 'confirm' | 'payment' | 'success';

export default function CheckoutPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('billing');
  const [doc, setDoc] = useState<MarketDocument | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [billingForm, setBillingForm] = useState<BillingAddress>({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', province: '', postalCode: '', country: 'VN',
  });

  // Load document and profile
  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/login'); return; }

    const load = async () => {
      try {
        const [docData, profileData] = await Promise.all([
          getDocumentBySlug(slug),
          getProfile(token),
        ]);
        if (!docData) { router.push('/documents'); return; }
        setDoc(docData);
        setProfile(profileData);

        if (profileData.billingAddress?.fullName) {
          setBillingForm(profileData.billingAddress);
          setStep('confirm');
        }
      } catch {
        toast({ title: 'Loi', description: 'Khong the tai du lieu', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, slug, router, toast]);

  const handleBillingSubmit = async () => {
    if (!billingForm.fullName || !billingForm.addressLine1 || !billingForm.city || !billingForm.province) {
      toast({ title: 'Thieu thong tin', description: 'Vui long dien day du dia chi', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ billingAddress: billingForm }, token!);
      setStep('confirm');
    } catch (err: unknown) {
      toast({ title: 'Loi', description: err instanceof Error ? err.message : 'Khong the luu dia chi', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!doc || !token) return;
    setSubmitting(true);
    try {
      const newOrder = await createOrder([doc._id], token);
      setOrder(newOrder);
      setStep('payment');
    } catch (err: unknown) {
      toast({ title: 'Loi', description: err instanceof Error ? err.message : 'Khong the tao don hang', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Poll for payment status
  const pollPayment = useCallback(async () => {
    if (!order || !token) return;
    try {
      const updated = await getOrderByCode(order.orderCode, token);
      if (updated.status === 'paid' || updated.status === 'confirmed') {
        setOrder(updated);
        setStep('success');
      }
    } catch { /* ignore */ }
  }, [order, token]);

  useEffect(() => {
    if (step !== 'payment' || !order) return;
    const interval = setInterval(pollPayment, 5000);
    return () => clearInterval(interval);
  }, [step, order, pollPayment]);

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link href={`/documents/${slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Quay lai
      </Link>

      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2 text-sm">
        {(['billing', 'confirm', 'payment', 'success'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-border" />}
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
              step === s ? 'bg-primary text-primary-foreground' :
              (['billing', 'confirm', 'payment', 'success'].indexOf(step) > i ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground')
            }`}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Step: Billing Address */}
      {step === 'billing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Dia chi thanh toan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ho va ten *</Label>
                <Input value={billingForm.fullName || ''} onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })} />
              </div>
              <div>
                <Label>So dien thoai</Label>
                <Input value={billingForm.phone || ''} onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Dia chi (So nha, duong) *</Label>
              <Input value={billingForm.addressLine1 || ''} onChange={(e) => setBillingForm({ ...billingForm, addressLine1: e.target.value })} />
            </div>
            <div>
              <Label>Phuong/Xa</Label>
              <Input value={billingForm.addressLine2 || ''} onChange={(e) => setBillingForm({ ...billingForm, addressLine2: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Quan/Huyen *</Label>
                <Input value={billingForm.city || ''} onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })} />
              </div>
              <div>
                <Label>Tinh/Thanh pho *</Label>
                <Input value={billingForm.province || ''} onChange={(e) => setBillingForm({ ...billingForm, province: e.target.value })} />
              </div>
            </div>
            <Button className="w-full" onClick={handleBillingSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tiep tuc
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Confirm Order */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle>Xac nhan don hang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg border p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{doc.title}</h3>
                <p className="text-sm text-muted-foreground">{doc.author}</p>
                <Badge variant="outline" className="mt-1">{doc.fileFormat.toUpperCase()}</Badge>
              </div>
              <div className="text-right font-bold">{formatPrice(doc.price)}</div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-semibold">Dia chi thanh toan</h4>
              <p className="text-sm text-muted-foreground">
                {billingForm.fullName}<br />
                {billingForm.addressLine1}{billingForm.addressLine2 ? `, ${billingForm.addressLine2}` : ''}<br />
                {billingForm.city}, {billingForm.province}
              </p>
              <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => setStep('billing')}>
                Thay doi dia chi
              </Button>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Tong cong</span>
              <span>{formatPrice(doc.price)}</span>
            </div>

            <Button className="w-full" size="lg" onClick={handleConfirmOrder} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
              Thanh toan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Payment (QR Code) */}
      {step === 'payment' && order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" /> Thanh toan chuyen khoan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Quet ma QR hoac chuyen khoan theo thong tin ben duoi
            </p>

            {order.qrCodeUrl && (
              <div className="flex justify-center">
                <img src={order.qrCodeUrl} alt="QR Code" className="h-64 w-64 rounded-lg border" />
              </div>
            )}

            <div className="rounded-lg bg-muted p-4 text-left text-sm">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngan hang</span>
                  <span className="font-medium">{order.bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">So tai khoan</span>
                  <span className="font-mono font-medium">{order.bankInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chu tai khoan</span>
                  <span className="font-medium">{order.bankInfo.accountName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">So tien</span>
                  <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Noi dung CK</span>
                  <span className="font-mono font-bold text-primary">{order.transferContent}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Don hang het han luc {new Date(order.expiresAt).toLocaleString('vi-VN')}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Dang cho xac nhan thanh toan...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold">Thanh toan thanh cong!</h2>
            <p className="mb-6 text-muted-foreground">
              Ban da mua thanh cong tai lieu. Tai tai lieu ngay hoac xem trong thu vien cua ban.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => router.push(`/documents/${slug}`)}>
                Tai tai lieu
              </Button>
              <Button variant="outline" onClick={() => router.push('/profile/purchases')}>
                Thu vien cua toi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
