// src/app/documents/[slug]/checkout/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getDocumentBySlug, getProfile, updateProfile, createOrder, getOrderByCode } from '@/lib/api';
import type { MarketDocument, Order, BillingAddress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Clock, Loader2, QrCode, CreditCard, UserRound, Copy } from 'lucide-react';

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

type Step = 'billing' | 'confirm' | 'payment' | 'success';

const checkoutSteps: { key: Step; label: string }[] = [
  { key: 'billing', label: 'Địa chỉ' },
  { key: 'confirm', label: 'Xác nhận' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'success', label: 'Hoàn tất' },
];

export default function CheckoutPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('billing');
  const [doc, setDoc] = useState<MarketDocument | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [billingForm, setBillingForm] = useState<BillingAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'VN',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const [docData, profileData] = await Promise.all([getDocumentBySlug(slug), getProfile(token)]);
        if (!docData) {
          router.push('/documents');
          return;
        }
        setDoc(docData);

        if (profileData.billingAddress?.fullName) {
          setBillingForm(profileData.billingAddress);
          setStep('confirm');
        }
      } catch {
        toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, slug, router, toast]);

  const handleBillingSubmit = async () => {
    if (!billingForm.fullName || !billingForm.addressLine1 || !billingForm.city || !billingForm.province) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng điền đầy đủ địa chỉ', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ billingAddress: billingForm }, token!);
      setStep('confirm');
    } catch (err: unknown) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể lưu địa chỉ',
        variant: 'destructive',
      });
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
      if (doc.price === 0) {
        setStep('success');
      } else {
        setStep('payment');
      }
    } catch (err: unknown) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể tạo đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pollPayment = useCallback(async () => {
    if (!order || !token) return;
    try {
      const updated = await getOrderByCode(order.orderCode, token);
      if (updated.status === 'paid' || updated.status === 'confirmed') {
        setOrder(updated);
        setStep('success');
      } else if (updated.status === 'expired' || updated.status === 'cancelled') {
        setOrder(updated);
        toast({ title: 'Don hang het han', description: 'Don hang da het han hoac bi huy. Vui long tao don moi.', variant: 'destructive' });
        router.push(`/documents/${slug}`);
      }
    } catch { /* ignore */ }
  }, [order, token, toast, router, slug]);

  useEffect(() => {
    if (step !== 'payment' || !order) return;
    const interval = setInterval(pollPayment, 5000);
    return () => clearInterval(interval);
  }, [step, order, pollPayment]);

  useEffect(() => {
    if (step !== 'payment' || !order) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      const remain = Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000);
      setRemainingSeconds(Math.max(0, remain));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, order]);

  const handleCopyTransferContent = async () => {
    if (!order?.transferContent) return;

    try {
      await navigator.clipboard.writeText(order.transferContent);
      toast({ title: 'Đã sao chép', description: 'Đã sao chép nội dung chuyển khoản.' });
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể sao chép nội dung chuyển khoản.', variant: 'destructive' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!doc) return null;

  const stepIndex = checkoutSteps.findIndex((s) => s.key === step);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/documents/${slug}`}
        className="mb-6 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft /> Quay lại
      </Link>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Thanh toán tài liệu</CardTitle>
              <CardDescription>Thực hiện từng bước để hoàn tất giao dịch an toàn.</CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {checkoutSteps.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <Badge variant={i <= stepIndex ? 'default' : 'secondary'}>{i + 1}</Badge>
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
          </Card>

          {step === 'billing' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard /> Địa chỉ thanh toán
                </CardTitle>
                <CardDescription>Thông tin này được lưu vào tài khoản cho các lần mua tiếp theo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Họ và tên *</Label>
                    <Input
                      value={billingForm.fullName || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={billingForm.phone || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ (Số nhà, đường) *</Label>
                  <Input
                    value={billingForm.addressLine1 || ''}
                    onChange={(e) => setBillingForm({ ...billingForm, addressLine1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phường/Xã</Label>
                  <Input
                    value={billingForm.addressLine2 || ''}
                    onChange={(e) => setBillingForm({ ...billingForm, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quận/Huyện *</Label>
                    <Input
                      value={billingForm.city || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tỉnh/Thành phố *</Label>
                    <Input
                      value={billingForm.province || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, province: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleBillingSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Tiếp tục
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {step === 'confirm' ? (
            <Card>
              <CardHeader>
                <CardTitle>Xác nhận đơn hàng</CardTitle>
                <CardDescription>Kiểm tra lại thông tin trước khi tạo đơn thanh toán.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">{doc.author}</p>
                    <Badge variant="outline" className="mt-1">
                      {doc.fileFormat.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right font-bold">{formatPrice(doc.price)}</div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Địa chỉ thanh toán</h4>
                  <p className="text-sm text-muted-foreground">
                    {billingForm.fullName}
                    <br />
                    {billingForm.addressLine1}
                    {billingForm.addressLine2 ? `, ${billingForm.addressLine2}` : ''}
                    <br />
                    {billingForm.city}, {billingForm.province}
                  </p>
                  <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => setStep('billing')}>
                    Thay đổi địa chỉ
                  </Button>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(doc.price)}</span>
                </div>

                <Button className="w-full" size="lg" onClick={handleConfirmOrder} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
                  {doc.price === 0 ? 'Nhận tài liệu' : 'Thanh toán'}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {step === 'payment' && order ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode /> Thanh toán chuyển khoản
                </CardTitle>
                <CardDescription>Quét QR hoặc chuyển khoản đúng nội dung để hệ thống tự động đối soát.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                {order.qrCodeUrl ? (
                  <div className="flex justify-center">
                    <img src={order.qrCodeUrl} alt="QR Code" className="h-64 w-64 rounded-lg border" />
                  </div>
                ) : null}

                <div className="rounded-lg bg-muted p-4 text-left text-sm">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngân hàng</span>
                      <span className="font-medium">{order.bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số tài khoản</span>
                      <span className="font-mono font-medium">{order.bankInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chủ tài khoản</span>
                      <span className="font-medium">{order.bankInfo.accountName}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số tiền</span>
                      <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Nội dung CK</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{order.transferContent}</span>
                        <Button variant="outline" size="sm" onClick={handleCopyTransferContent}>
                          <Copy className="mr-1 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Đơn hàng hết hạn lúc {new Date(order.expiresAt).toLocaleString('vi-VN')}
                </div>

                {remainingSeconds !== null ? (
                  <div className={`text-sm font-semibold ${remainingSeconds > 0 ? 'text-amber-600' : 'text-destructive'}`}>
                    {remainingSeconds > 0
                      ? `Còn lại ${formatCountdown(remainingSeconds)} để hoàn tất thanh toán`
                      : 'Đơn hàng đã hết hạn, vui lòng tạo đơn mới.'}
                  </div>
                ) : null}

                <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang chờ xác nhận thanh toán...
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'success' ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h2 className="mb-2 text-2xl font-bold">Thanh toán thành công!</h2>
                <p className="mb-6 text-muted-foreground">
                  Bạn đã mua thành công tài liệu. Tải tài liệu ngay hoặc xem trong thư viện của bạn.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={() => router.push(`/documents/${slug}`)}>Tải tài liệu</Button>
                  <Button variant="outline" onClick={() => router.push('/profile/purchases')}>
                    Thư viện của tôi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
              <CardDescription>Xác nhận nhanh thông tin sản phẩm và giá trị thanh toán.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="line-clamp-2 text-sm font-semibold">{doc.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{doc.author}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="outline">{doc.fileFormat.toUpperCase()}</Badge>
                  <span className="font-bold">{formatPrice(doc.price)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Khách hàng</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <UserRound className="h-4 w-4" />
                  {billingForm.fullName || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge variant={step === 'success' ? 'default' : 'secondary'}>{checkoutSteps[stepIndex].label}</Badge>
              </div>
              <div className="flex items-center justify-between text-base font-bold">
                <span>Tổng cộng</span>
                <span>{formatPrice(doc.price)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
