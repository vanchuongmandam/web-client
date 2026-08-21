// src/app/documents/[slug]/checkout/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useCheckoutStore, type CheckoutStep } from '@/stores/checkout.store';
import { getDocumentBySlug, getProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Clock, Loader2, QrCode, CreditCard, UserRound, Copy, Check, TicketPercent } from 'lucide-react';

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

const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-category-brown', text: 'text-pastel-warm', border: 'border-category-red-dark', tagBg: 'bg-category-red-dark/40 text-pastel-warm/90', lineBg: 'bg-category-copper' }, // Warm Mahogany
    { bg: 'bg-forest-deepest', text: 'text-pastel-green', border: 'border-forest-night', tagBg: 'bg-forest-night/40 text-pastel-green/90', lineBg: 'bg-forest' }, // Forest Moss
    { bg: 'bg-category-purple-dark', text: 'text-pastel-purple', border: 'border-category-purple-night', tagBg: 'bg-category-purple-night/40 text-pastel-purple/90', lineBg: 'bg-category-purple' }, // Dark Aubergine
    { bg: 'bg-category-blue-dark', text: 'text-pastel-blue', border: 'border-category-blue-night', tagBg: 'bg-category-blue-night/40 text-pastel-blue/90', lineBg: 'bg-category-blue' }, // Slate Ocean
    { bg: 'bg-warm-sand', text: 'text-earth-dark', border: 'border-sand-dark', tagBg: 'bg-earth-dark/15 text-earth-dark/95', lineBg: 'bg-sand-muted' }, // Vintage Parchment
  ];
  return themes[sum % themes.length];
};

const getStatusBadgeClass = (currentStep: Step) => {
  switch (currentStep) {
    case 'success':
      return 'bg-forest-bright text-white hover:bg-forest-bright border-none font-bold';
    case 'payment':
      return 'bg-amber-600 text-white hover:bg-amber-600 border-none font-bold';
    case 'confirm':
      return 'bg-forest text-warm-cream hover:bg-forest border-none font-bold';
    default:
      return 'bg-sand text-earth-muted hover:bg-sand border-none font-bold';
  }
};

type Step = CheckoutStep;

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
  const { token, isLoading: authLoading } = useAuthStore();
  const { toast } = useToast();

  const {
    step,
    doc,
    order,
    billingForm,
    balance,
    useBalance,
    couponCode,
    appliedCoupon,
    discountAmount,
    couponError,
    isValidatingCoupon,
    submitting,
    remainingSeconds,
    initCheckout,
    setStep,
    setBillingForm,
    saveBillingAddress,
    setUseBalance,
    setCouponCode,
    applyCoupon,
    submitOrder,
    pollOrderStatus,
    tickCountdown,
  } = useCheckoutStore();

  const [loading, setLoading] = useState(true);

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
        initCheckout(docData, profileData.balance || 0, profileData.billingAddress);
      } catch {
        toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, slug, router, toast, initCheckout]);

  const handleBillingSubmit = async () => {
    if (!billingForm.fullName || !billingForm.addressLine1 || !billingForm.city || !billingForm.province) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng điền đầy đủ địa chỉ', variant: 'destructive' });
      return;
    }

    const ok = await saveBillingAddress(token!);
    if (!ok) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu địa chỉ',
        variant: 'destructive',
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const ok = await applyCoupon(token!);
    if (ok) {
      const amount = useCheckoutStore.getState().discountAmount;
      toast({
        title: 'Áp dụng thành công',
        description: `Đã áp dụng mã giảm giá. Bạn được giảm ${formatPrice(amount)}`,
      });
    }
  };

  const handleConfirmOrder = async () => {
    const newOrder = await submitOrder(token!);
    if (!newOrder) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo đơn hàng',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (step !== 'payment' || !order) return;
    const interval = setInterval(async () => {
      const status = await pollOrderStatus(token!);
      if (status === 'expired') {
        toast({ title: 'Đơn hàng hết hạn', description: 'Đơn hàng đã hết hạn hoặc bị hủy. Vui lòng tạo đơn mới.', variant: 'destructive' });
        router.push(`/documents/${slug}`);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [step, order, token, pollOrderStatus, toast, router, slug]);

  useEffect(() => {
    if (step !== 'payment' || !order) return;
    tickCountdown();
    const interval = setInterval(() => tickCountdown(), 1000);
    return () => clearInterval(interval);
  }, [step, order, tickCountdown]);

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
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (!doc) return null;

  const stepIndex = checkoutSteps.findIndex((s) => s.key === step);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Back button */}
      <Link
        href={`/documents/${slug}`}
        className="mb-8 inline-flex items-center gap-2 rounded-md border-2 border-sand bg-warm-cream px-4 py-2 text-sm font-bold text-forest hover:bg-sand/30 transition-colors shadow-sm w-fit animate-fade-in"
      >
        <ArrowLeft className="size-4" /> Quay lại chi tiết tài liệu
      </Link>

      {/* Stepper progress indicator */}
      <div className="mb-12 w-full max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between relative">
          {checkoutSteps.map((s, i) => {
            const isCompleted = i < stepIndex;
            const isActive = i === stepIndex;
            return (
              <div key={s.key} className="flex-1 flex items-center last:flex-initial">
                {/* Step node */}
                <div className="flex flex-col items-center relative z-10 shrink-0">
                  <div
                    className={`size-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold ${isCompleted
                        ? 'bg-forest border-forest text-warm-cream'
                        : isActive
                          ? 'bg-warm-cream border-forest text-forest ring-4 ring-forest/10'
                          : 'bg-warm-cream border-sand-light text-stone-400'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[3px]" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-bold whitespace-nowrap absolute top-9 left-1/2 -translate-x-1/2 transition-colors ${isActive ? 'text-forest' : 'text-stone-500'
                      }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Connecting line to the next step */}
                {i < checkoutSteps.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 bg-warm-sand relative">
                    <div
                      className={`absolute inset-0 bg-forest transition-all duration-500 ${i < stepIndex ? 'w-full' : 'w-0'
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-6"></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">

        {/* LEFT COLUMN: Actions & Forms */}
        <div className="space-y-6 lg:col-span-8">

          {/* STEP 1: BILLING ADDRESS */}
          {step === 'billing' ? (
            <Card className="border-2 border-sand-light bg-warm-cream/70 shadow-xs rounded-xl">
              <CardHeader className="pb-3 border-b border-sand-light/60">
                <CardTitle className="text-xl font-sans font-bold text-forest flex items-center gap-2">
                  <CreditCard className="size-5" /> Địa chỉ thanh toán
                </CardTitle>
                <CardDescription>Thông tin này dùng để xuất hóa đơn và lưu thông tin mua hàng.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 font-sans">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-earth-muted font-semibold text-xs uppercase tracking-wider">Họ và tên *</Label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30"
                      value={billingForm.fullName || ''}
                      onChange={(e) => setBillingForm({ fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-earth-muted font-semibold text-xs uppercase tracking-wider">Số điện thoại</Label>
                    <Input
                      placeholder="0901234567"
                      className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30"
                      value={billingForm.phone || ''}
                      onChange={(e) => setBillingForm({ phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-earth-muted font-semibold text-xs uppercase tracking-wider">Địa chỉ (Số nhà, đường) *</Label>
                  <Input
                    placeholder="123 Đường Lê Lợi"
                    className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30"
                    value={billingForm.addressLine1 || ''}
                    onChange={(e) => setBillingForm({ addressLine1: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-earth-muted font-semibold text-xs uppercase tracking-wider">Phường/Xã</Label>
                  <Input
                    placeholder="Phường Bến Thành"
                    className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30"
                    value={billingForm.addressLine2 || ''}
                    onChange={(e) => setBillingForm({ addressLine2: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-earth-muted font-semibold text-xs uppercase tracking-wider">Quận/Huyện *</Label>
                    <Input
                      placeholder="Quận 1"
                      className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30"
                      value={billingForm.city || ''}
                      onChange={(e) => setBillingForm({ city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-earth-muted font-semibold text-xs uppercase tracking-wider">Tỉnh/Thành phố *</Label>
                    <Input
                      placeholder="TP. Hồ Chí Minh"
                      className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30"
                      value={billingForm.province || ''}
                      onChange={(e) => setBillingForm({ province: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full bg-forest text-pastel-pink hover:bg-forest-dark font-bold py-5 rounded-md shadow-sm" onClick={handleBillingSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Xác nhận địa chỉ & Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* STEP 2: CONFIRMATION & PAYMENT METHOD */}
          {step === 'confirm' ? (
            <Card className="border-2 border-sand-light bg-warm-cream/70 shadow-xs rounded-xl">
              <CardHeader className="pb-3 border-b border-sand-light/60">
                <CardTitle className="text-xl font-sans font-bold text-forest">Xác nhận & Thanh toán</CardTitle>
                <CardDescription>Chọn phương thức thanh toán phù hợp để hoàn tất đơn hàng.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 font-sans">

                {/* Address Summary */}
                <div className="rounded-lg border-2 border-sand bg-warm-cream p-4 relative">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-earth-lighter mb-1">Địa chỉ thanh toán</h4>
                  <p className="text-sm font-semibold text-earth-muted">
                    {billingForm.fullName} {billingForm.phone ? `(${billingForm.phone})` : ''}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {billingForm.addressLine1}
                    {billingForm.addressLine2 ? `, ${billingForm.addressLine2}` : ''}
                    {`, ${billingForm.city}, ${billingForm.province}`}
                  </p>
                  <Button
                    variant="link"
                    className="absolute top-3 right-3 text-forest hover:text-forest-dark text-xs h-auto p-0 font-bold"
                    onClick={() => setStep('billing')}
                  >
                    Thay đổi
                  </Button>
                </div>

                {/* Conditional Pricing Flow */}
                {doc.price > 0 ? (
                  <div className="space-y-4">
                    <Label className="text-earth-muted font-bold text-sm">Phương thức thanh toán</Label>

                    <div className="grid gap-4 sm:grid-cols-2">

                      {/* Wallet Option */}
                      <button
                        type="button"
                        disabled={balance < Math.max(0, doc.price - discountAmount)}
                        onClick={() => setUseBalance(true)}
                        className={`flex flex-col text-left p-4 rounded-md border-2 transition-all cursor-pointer relative overflow-hidden ${useBalance
                            ? 'border-forest-bright bg-forest-tint/40 ring-2 ring-forest-bright/10'
                            : 'border-sand hover:border-sand/80 bg-transparent'
                          } ${balance < Math.max(0, doc.price - discountAmount) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2 text-stone-800">
                          <CreditCard className={`size-5 ${useBalance ? 'text-forest-bright' : 'text-stone-500'}`} />
                          <span className="font-bold text-sm">Ví tài khoản</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Số dư khả dụng: <span className="font-semibold text-stone-700">{formatPrice(balance)}</span>
                        </p>
                        {balance < Math.max(0, doc.price - discountAmount) && (
                          <p className="text-[10px] text-red-700 font-medium mt-1">Số dư không đủ</p>
                        )}
                        {useBalance && (
                          <div className="absolute top-2.5 right-2.5 size-4 bg-forest-bright rounded-full flex items-center justify-center text-white">
                            <Check className="size-2.5" />
                          </div>
                        )}
                      </button>

                      {/* QR Payment Option */}
                      <button
                        type="button"
                        onClick={() => setUseBalance(false)}
                        className={`flex flex-col text-left p-4 rounded-md border-2 transition-all cursor-pointer relative overflow-hidden ${!useBalance
                            ? 'border-forest bg-sand/20 ring-2 ring-forest/10'
                            : 'border-sand hover:border-sand/80 bg-transparent'
                          }`}
                      >
                        <div className="flex items-center gap-2 text-stone-800">
                          <QrCode className={`size-5 ${!useBalance ? 'text-forest' : 'text-stone-500'}`} />
                          <span className="font-bold text-sm">Chuyển khoản QR</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Quét mã chuyển khoản tức thì qua SePay tự động đối soát.
                        </p>
                        {!useBalance && (
                          <div className="absolute top-2.5 right-2.5 size-4 bg-forest rounded-full flex items-center justify-center text-white">
                            <Check className="size-2.5" />
                          </div>
                        )}
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border-2 border-dashed border-forest/30 bg-forest/5 p-5 text-center">
                    <CheckCircle className="size-10 text-forest mx-auto mb-2 opacity-85" />
                    <h4 className="font-bold text-forest text-sm">Tài liệu miễn phí</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Tài liệu này được chia sẻ hoàn toàn miễn phí. Quý khách chỉ cần nhấn nút bên dưới để nhận ngay mà không cần giao dịch ngân hàng.
                    </p>
                  </div>
                )}

                {/* Coupon Code Option */}
                {doc.price > 0 && (
                  <div className="space-y-2 pt-2 border-t border-sand-light">
                    <Label className="text-earth-muted font-bold text-sm flex items-center gap-2">
                      <TicketPercent className="size-4 text-earth-lighter" /> Mã giảm giá (Nếu có)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá..."
                        className="bg-warm-cream border-2 border-sand focus-visible:ring-forest/30 uppercase"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={submitting || isValidatingCoupon}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-sand hover:bg-sand/40 text-forest font-bold shrink-0 shadow-sm"
                        onClick={handleApplyCoupon}
                        disabled={submitting || isValidatingCoupon || !couponCode.trim()}
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Áp dụng'
                        )}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 font-medium">{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <p className="text-xs text-green-600 font-medium">
                        Đã áp dụng mã: <span className="font-bold">{appliedCoupon}</span> (-{formatPrice(discountAmount)})
                      </p>
                    )}
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <Button
                    className={`w-full py-6 rounded-md text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${useBalance
                        ? "bg-forest-bright hover:bg-forest-dark"
                        : "bg-forest hover:bg-forest-dark"
                      }`}
                    size="lg"
                    onClick={handleConfirmOrder}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : useBalance ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <QrCode className="h-5 w-5" />
                    )}
                    {doc.price === 0 ? 'Nhận tài liệu ngay' : useBalance ? 'Thanh toán bằng ví' : 'Tạo đơn & Thanh toán QR'}
                  </Button>
                </div>

              </CardContent>
            </Card>
          ) : null}

          {/* STEP 3: QR BANK TRANSFER */}
          {step === 'payment' && order ? (
            <Card className="border-2 border-sand-light bg-warm-cream/70 shadow-xs rounded-xl">
              <CardHeader className="pb-3 border-b border-sand-light/60 text-center md:text-left">
                <CardTitle className="text-xl font-sans font-bold text-forest flex items-center justify-center md:justify-start gap-2">
                  <QrCode className="size-5" /> Thanh toán chuyển khoản
                </CardTitle>
                <CardDescription>Quét mã QR bằng ứng dụng ngân hàng hoặc tự nhập thông tin chuyển khoản.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 font-sans">

                <div className="flex flex-col md:flex-row gap-6 items-center">

                  {/* QR Image block */}
                  {order.qrCodeUrl ? (
                    <div className="flex flex-col items-center shrink-0">
                      <div className="bg-warm-cream border-2 border-sand p-3 rounded-lg shadow-xs">
                        <img src={order.qrCodeUrl} alt="QR Code" loading="lazy" decoding="async" className="h-56 w-56 object-contain" />
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-semibold">VietQR / Napas</span>
                    </div>
                  ) : null}

                  {/* Transfer Details details */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="text-sm font-bold text-earth-muted uppercase tracking-wide border-b border-sand pb-1">
                      Thông tin tài khoản nhận
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span className="text-muted-foreground">Ngân hàng:</span>
                      <span className="col-span-2 font-bold text-stone-800 text-right">{order.bankInfo.bankName}</span>

                      <span className="text-muted-foreground">Số tài khoản:</span>
                      <span className="col-span-2 font-mono font-bold text-stone-900 text-right text-sm">{order.bankInfo.accountNumber}</span>

                      <span className="text-muted-foreground">Chủ tài khoản:</span>
                      <span className="col-span-2 font-semibold text-stone-800 text-right uppercase">{order.bankInfo.accountName}</span>

                      <span className="text-muted-foreground">Số tiền:</span>
                      <span className="col-span-2 font-extrabold text-category-red text-right text-base">{formatPrice(order.totalAmount)}</span>
                    </div>

                    <div className="border-2 border-dashed border-sand bg-warm-cream p-3 rounded-lg flex items-center justify-between gap-3 mt-4">
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Nội dung chuyển khoản</span>
                        <div className="font-mono font-black text-forest text-lg select-all truncate mt-0.5">
                          {order.transferContent}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-sand hover:bg-sand/40 text-forest font-bold shrink-0 shadow-xs rounded-md"
                        onClick={handleCopyTransferContent}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>

                  </div>
                </div>

                <Separator className="bg-warm-sand" />

                {/* Countdown and Waiting loader */}
                <div className="bg-sand/20 border border-sand/60 rounded-lg p-4 space-y-3.5 text-center">

                  {remainingSeconds !== null && remainingSeconds > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-700">
                      <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                      <span>Đơn hàng sẽ tự động hủy sau <strong className="text-amber-700 font-mono text-sm">{formatCountdown(remainingSeconds)}</strong></span>
                    </div>
                  ) : remainingSeconds !== null && (
                    <div className="text-xs font-bold text-red-700">
                      Đơn hàng đã hết hạn thanh toán, vui lòng quay lại trang tài liệu để tạo đơn mới.
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-forest bg-sand/40 py-2.5 px-4 rounded-md inline-flex max-w-full">
                    <Loader2 className="h-4 w-4 animate-spin text-forest" />
                    <span>Đang chờ đối soát tự động từ ngân hàng...</span>
                  </div>

                  <p className="text-[10px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Sau khi quý khách chuyển khoản thành công, hệ thống SePay sẽ ghi nhận và mở khóa tài liệu tự động trong vòng 30 giây đến 1 phút. Vui lòng không đóng trang này.
                  </p>
                </div>

              </CardContent>
            </Card>
          ) : null}

          {/* STEP 4: SUCCESS PAGE */}
          {step === 'success' ? (
            <Card className="border-2 border-sand-light bg-warm-cream/70 shadow-xs rounded-xl">
              <CardContent className="p-8 text-center font-sans space-y-5">
                <div className="size-16 bg-forest-tint rounded-full flex items-center justify-center mx-auto border-2 border-sage-border">
                  <CheckCircle className="h-10 w-10 text-forest-bright" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-sans font-bold text-forest">Thanh toán thành công!</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Giao dịch của bạn đã được đối soát thành công. Tài liệu hiện đã được mở khóa và lưu vào thư viện cá nhân của bạn.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
                  <Button className="bg-forest text-pastel-pink hover:bg-forest-dark font-bold px-6 shadow-sm" onClick={() => router.push(`/documents/${slug}`)}>
                    Xem & Tải tài liệu
                  </Button>
                  <Button variant="outline" className="border-sand hover:bg-sand/40 text-forest font-bold" onClick={() => router.push('/profile/purchases')}>
                    Thư viện cá nhân
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

        </div>

        {/* RIGHT COLUMN: Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 border-2 border-sand-light bg-warm-cream/70 shadow-sm rounded-md">
            <CardHeader className="pb-3 border-b border-sand-light/60">
              <CardTitle className="text-lg text-earth">Tóm tắt đơn hàng</CardTitle>
              <CardDescription>Chi tiết tài liệu và tổng thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 font-sans">

              {/* Document Info Row with Compact Cover */}
              <div className="flex gap-3.5 items-start">

                {/* Book cover (thumbnail size) */}
                <div className="relative w-16 aspect-[1/1.38] shrink-0 overflow-hidden rounded-md shadow-xs border border-viewer-dark-border/10 bg-warm-cream">
                  {doc.previewImages?.[0] ? (
                    <img src={doc.previewImages[0]} alt={doc.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${getBookCoverTheme(doc._id).bg} ${getBookCoverTheme(doc._id).text} flex flex-col p-1.5 justify-between relative`}>
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                      <span className="text-[5px] uppercase tracking-wider font-semibold opacity-75 truncate max-w-full text-center">
                        {doc.category?.name || 'TÀI LIỆU'}
                      </span>
                      <p className="font-bold text-[6px] leading-tight line-clamp-3 text-center my-auto px-0.5">
                        {doc.title}
                      </p>
                      <span className="text-[5px] opacity-75 font-sans pt-0.5 border-t border-current/10 text-center">
                        {doc.fileFormat.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-earth line-clamp-2 leading-snug" title={doc.title}>
                    {doc.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground italic">Tác giả: {doc.author || 'Khuyết danh'}</p>
                  <Badge variant="outline" className="mt-1.5 text-[10px] py-0 px-1.5 font-bold uppercase tracking-wider text-stone-600 bg-stone-100 border-sand">
                    {doc.fileFormat.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-warm-sand" />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-earth-lighter">Khách hàng:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-earth-muted truncate max-w-[150px]">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{billingForm.fullName || 'Chưa cập nhật'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-earth-lighter">Trạng thái:</span>
                  <Badge className={getStatusBadgeClass(step)}>
                    {checkoutSteps[stepIndex].label}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-warm-sand" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-sans">
                  <span className="text-earth-lighter">Giá bán:</span>
                  <span className="font-semibold text-stone-700">{formatPrice(doc.price)}</span>
                </div>
                {doc.originalPrice && doc.originalPrice > doc.price && (
                  <div className="flex justify-between text-red-700">
                    <span className="text-earth-lighter">Tiết kiệm:</span>
                    <span className="font-semibold">-{formatPrice(doc.originalPrice - doc.price)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span className="text-earth-lighter">Giảm giá:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2.5 border-t border-dashed border-sand-light mt-2">
                  <span className="text-base font-bold text-earth">Tổng cộng</span>
                  <span className="text-xl font-extrabold text-category-red">
                    {formatPrice(Math.max(0, doc.price - discountAmount))}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
