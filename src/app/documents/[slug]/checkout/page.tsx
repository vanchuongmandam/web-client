// src/app/documents/[slug]/checkout/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getDocumentBySlug, getProfile, updateProfile, createOrder, getOrderByCode, validateCoupon } from '@/lib/api';
import type { MarketDocument, Order, BillingAddress } from '@/lib/types';
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
    { bg: 'bg-[#5c3e35]', text: 'text-[#f4eae1]', border: 'border-[#432d27]', tagBg: 'bg-[#432d27]/40 text-[#f4eae1]/90', lineBg: 'bg-[#a37055]' }, // Warm Mahogany
    { bg: 'bg-[#2b3a32]', text: 'text-[#e9f1e8]', border: 'border-[#1d2722]', tagBg: 'bg-[#1d2722]/40 text-[#e9f1e8]/90', lineBg: 'bg-[#526f5c]' }, // Forest Moss
    { bg: 'bg-[#3b2b3a]', text: 'text-[#f5eaf4]', border: 'border-[#261c25]', tagBg: 'bg-[#261c25]/40 text-[#f5eaf4]/90', lineBg: 'bg-[#7a5879]' }, // Dark Aubergine
    { bg: 'bg-[#1f2d3d]', text: 'text-[#e9f1f6]', border: 'border-[#131b25]', tagBg: 'bg-[#131b25]/40 text-[#e9f1f6]/90', lineBg: 'bg-[#4f6b8c]' }, // Slate Ocean
    { bg: 'bg-[#e2d6c5]', text: 'text-[#3e342a]', border: 'border-[#ccbfae]', tagBg: 'bg-[#3e342a]/15 text-[#3e342a]/95', lineBg: 'bg-[#bca68d]' }, // Vintage Parchment
  ];
  return themes[sum % themes.length];
};

const getStatusBadgeClass = (currentStep: Step) => {
  switch (currentStep) {
    case 'success':
      return 'bg-[#3c6b41] text-white hover:bg-[#3c6b41] border-none font-bold';
    case 'payment':
      return 'bg-amber-600 text-white hover:bg-amber-600 border-none font-bold';
    case 'confirm':
      return 'bg-[#4c6b54] text-[#fcf9f2] hover:bg-[#4c6b54] border-none font-bold';
    default:
      return 'bg-[#ebdcb9] text-[#635748] hover:bg-[#ebdcb9] border-none font-bold';
  }
};

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
  const [balance, setBalance] = useState<number>(0);
  const [useBalance, setUseBalance] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

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
        setBalance(profileData.balance || 0);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !token || !doc) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCoupon(couponCode.toUpperCase(), [doc._id], token);
      if (res.valid) {
        setDiscountAmount(res.discountAmount);
        setAppliedCoupon(couponCode.toUpperCase());
        toast({
          title: 'Áp dụng thành công',
          description: `Đã áp dụng mã giảm giá. Bạn được giảm ${formatPrice(res.discountAmount)}`,
        });
      } else {
        setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Mã giảm giá không hợp lệ.');
      setDiscountAmount(0);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!doc || !token) return;
    setSubmitting(true);
    try {
      const activeCoupon = appliedCoupon ? appliedCoupon : (couponCode ? couponCode.toUpperCase() : undefined);
      const newOrder = await createOrder([doc._id], token, useBalance, activeCoupon);
      setOrder(newOrder);
      if (newOrder.status === 'paid' || newOrder.status === 'confirmed' || newOrder.totalAmount === 0) {
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
        toast({ title: 'Đơn hàng hết hạn', description: 'Đơn hàng đã hết hạn hoặc bị hủy. Vui lòng tạo đơn mới.', variant: 'destructive' });
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
        <Loader2 className="h-8 w-8 animate-spin text-[#4c6b54]" />
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
        className="mb-8 inline-flex items-center gap-2 rounded-md border-2 border-[#ebdcb9] bg-[#fcf9f2] px-4 py-2 text-sm font-bold text-[#4c6b54] hover:bg-[#ebdcb9]/30 transition-colors shadow-sm w-fit animate-fade-in"
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
                    className={`size-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold ${
                      isCompleted 
                        ? 'bg-[#4c6b54] border-[#4c6b54] text-[#fcf9f2]' 
                        : isActive 
                          ? 'bg-[#fcf9f2] border-[#4c6b54] text-[#4c6b54] ring-4 ring-[#4c6b54]/10' 
                          : 'bg-[#fcf9f2] border-[#e6dfd3] text-stone-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[3px]" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span 
                    className={`mt-2 text-xs font-bold whitespace-nowrap absolute top-9 left-1/2 -translate-x-1/2 transition-colors ${
                      isActive ? 'text-[#4c6b54]' : 'text-stone-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                
                {/* Connecting line to the next step */}
                {i < checkoutSteps.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 bg-[#e6dfd3] relative">
                    <div 
                      className={`absolute inset-0 bg-[#4c6b54] transition-all duration-500 ${
                        i < stepIndex ? 'w-full' : 'w-0'
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
            <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 shadow-sm rounded-md">
              <CardHeader className="pb-3 border-b border-[#e6dfd3]/60">
                <CardTitle className="text-xl font-serif text-[#4c6b54] flex items-center gap-2">
                  <CreditCard className="size-5" /> Địa chỉ thanh toán
                </CardTitle>
                <CardDescription>Thông tin này dùng để xuất hóa đơn và lưu thông tin mua hàng.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 font-sans">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[#5a5045] font-semibold text-xs uppercase tracking-wider">Họ và tên *</Label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30"
                      value={billingForm.fullName || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#5a5045] font-semibold text-xs uppercase tracking-wider">Số điện thoại</Label>
                    <Input
                      placeholder="0901234567"
                      className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30"
                      value={billingForm.phone || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[#5a5045] font-semibold text-xs uppercase tracking-wider">Địa chỉ (Số nhà, đường) *</Label>
                  <Input
                    placeholder="123 Đường Lê Lợi"
                    className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30"
                    value={billingForm.addressLine1 || ''}
                    onChange={(e) => setBillingForm({ ...billingForm, addressLine1: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[#5a5045] font-semibold text-xs uppercase tracking-wider">Phường/Xã</Label>
                  <Input
                    placeholder="Phường Bến Thành"
                    className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30"
                    value={billingForm.addressLine2 || ''}
                    onChange={(e) => setBillingForm({ ...billingForm, addressLine2: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[#5a5045] font-semibold text-xs uppercase tracking-wider">Quận/Huyện *</Label>
                    <Input
                      placeholder="Quận 1"
                      className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30"
                      value={billingForm.city || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#5a5045] font-semibold text-xs uppercase tracking-wider">Tỉnh/Thành phố *</Label>
                    <Input
                      placeholder="TP. Hồ Chí Minh"
                      className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30"
                      value={billingForm.province || ''}
                      onChange={(e) => setBillingForm({ ...billingForm, province: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button className="w-full bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] font-bold py-5 rounded-md shadow-sm" onClick={handleBillingSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Xác nhận địa chỉ & Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* STEP 2: CONFIRMATION & PAYMENT METHOD */}
          {step === 'confirm' ? (
            <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 shadow-sm rounded-md">
              <CardHeader className="pb-3 border-b border-[#e6dfd3]/60">
                <CardTitle className="text-xl font-serif text-[#4c6b54]">Xác nhận & Thanh toán</CardTitle>
                <CardDescription>Chọn phương thức thanh toán phù hợp để hoàn tất đơn hàng.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 font-sans">
                
                {/* Address Summary */}
                <div className="rounded-md border-2 border-[#ebdcb9] bg-[#fdfaf5] p-4 relative">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-[#8c7e6c] mb-1">Địa chỉ thanh toán</h4>
                  <p className="text-sm font-semibold text-[#5a5045]">
                    {billingForm.fullName} {billingForm.phone ? `(${billingForm.phone})` : ''}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {billingForm.addressLine1}
                    {billingForm.addressLine2 ? `, ${billingForm.addressLine2}` : ''}
                    {`, ${billingForm.city}, ${billingForm.province}`}
                  </p>
                  <Button 
                    variant="link" 
                    className="absolute top-3 right-3 text-[#4c6b54] hover:text-[#3b5341] text-xs h-auto p-0 font-bold" 
                    onClick={() => setStep('billing')}
                  >
                    Thay đổi
                  </Button>
                </div>

                {/* Conditional Pricing Flow */}
                {doc.price > 0 ? (
                  <div className="space-y-4">
                    <Label className="text-[#5a5045] font-bold text-sm">Phương thức thanh toán</Label>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      
                      {/* Wallet Option */}
                      <button
                        type="button"
                        disabled={balance < Math.max(0, doc.price - discountAmount)}
                        onClick={() => setUseBalance(true)}
                        className={`flex flex-col text-left p-4 rounded-md border-2 transition-all cursor-pointer relative overflow-hidden ${
                          useBalance
                            ? 'border-[#3c6b41] bg-[#ebf4ef]/40 ring-2 ring-[#3c6b41]/10'
                            : 'border-[#ebdcb9] hover:border-[#ebdcb9]/80 bg-transparent'
                        } ${balance < Math.max(0, doc.price - discountAmount) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2 text-stone-800">
                          <CreditCard className={`size-5 ${useBalance ? 'text-[#3c6b41]' : 'text-stone-500'}`} />
                          <span className="font-bold text-sm">Ví tài khoản</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Số dư khả dụng: <span className="font-semibold text-stone-700">{formatPrice(balance)}</span>
                        </p>
                        {balance < Math.max(0, doc.price - discountAmount) && (
                          <p className="text-[10px] text-red-700 font-medium mt-1">Số dư không đủ</p>
                        )}
                        {useBalance && (
                          <div className="absolute top-2.5 right-2.5 size-4 bg-[#3c6b41] rounded-full flex items-center justify-center text-white">
                            <Check className="size-2.5" />
                          </div>
                        )}
                      </button>

                      {/* QR Payment Option */}
                      <button
                        type="button"
                        onClick={() => setUseBalance(false)}
                        className={`flex flex-col text-left p-4 rounded-md border-2 transition-all cursor-pointer relative overflow-hidden ${
                          !useBalance
                            ? 'border-[#4c6b54] bg-[#ebdcb9]/20 ring-2 ring-[#4c6b54]/10'
                            : 'border-[#ebdcb9] hover:border-[#ebdcb9]/80 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-stone-800">
                          <QrCode className={`size-5 ${!useBalance ? 'text-[#4c6b54]' : 'text-stone-500'}`} />
                          <span className="font-bold text-sm">Chuyển khoản QR</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Quét mã chuyển khoản tức thì qua SePay tự động đối soát.
                        </p>
                        {!useBalance && (
                          <div className="absolute top-2.5 right-2.5 size-4 bg-[#4c6b54] rounded-full flex items-center justify-center text-white">
                            <Check className="size-2.5" />
                          </div>
                        )}
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border-2 border-dashed border-[#4c6b54]/30 bg-[#4c6b54]/5 p-5 text-center">
                    <CheckCircle className="size-10 text-[#4c6b54] mx-auto mb-2 opacity-85" />
                    <h4 className="font-bold text-[#4c6b54] text-sm">Tài liệu miễn phí</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Tài liệu này được chia sẻ hoàn toàn miễn phí. Quý khách chỉ cần nhấn nút bên dưới để nhận ngay mà không cần giao dịch ngân hàng.
                    </p>
                  </div>
                )}

                {/* Coupon Code Option */}
                {doc.price > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#e6dfd3]">
                    <Label className="text-[#5a5045] font-bold text-sm flex items-center gap-2">
                      <TicketPercent className="size-4 text-[#8c7e6c]" /> Mã giảm giá (Nếu có)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá..."
                        className="bg-[#fcf9f2] border-2 border-[#ebdcb9] focus-visible:ring-[#4c6b54]/30 uppercase"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (appliedCoupon) {
                            setAppliedCoupon(null);
                            setDiscountAmount(0);
                            setCouponError(null);
                          }
                        }}
                        disabled={submitting || isValidatingCoupon}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#ebdcb9] hover:bg-[#ebdcb9]/40 text-[#4c6b54] font-bold shrink-0 shadow-sm"
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
                    className={`w-full py-6 rounded-md text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                      useBalance 
                        ? "bg-[#3c6b41] hover:bg-[#2e5232]" 
                        : "bg-[#4c6b54] hover:bg-[#3b5341]"
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
            <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 shadow-sm rounded-md">
              <CardHeader className="pb-3 border-b border-[#e6dfd3]/60 text-center md:text-left">
                <CardTitle className="text-xl font-serif text-[#4c6b54] flex items-center justify-center md:justify-start gap-2">
                  <QrCode className="size-5" /> Thanh toán chuyển khoản
                </CardTitle>
                <CardDescription>Quét mã QR bằng ứng dụng ngân hàng hoặc tự nhập thông tin chuyển khoản.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 font-sans">
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  
                  {/* QR Image block */}
                  {order.qrCodeUrl ? (
                    <div className="flex flex-col items-center shrink-0">
                      <div className="bg-[#fcf9f2] border-2 border-[#ebdcb9] p-3 rounded-md shadow-md">
                        <img src={order.qrCodeUrl} alt="QR Code" className="h-56 w-56 object-contain" />
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-semibold">VietQR / Napas</span>
                    </div>
                  ) : null}

                  {/* Transfer Details details */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="text-sm font-bold text-[#5a5045] uppercase tracking-wide border-b border-[#ebdcb9] pb-1">
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
                      <span className="col-span-2 font-extrabold text-[#8e2929] text-right text-base">{formatPrice(order.totalAmount)}</span>
                    </div>

                    <div className="border-2 border-dashed border-[#ebdcb9] bg-[#fdfaf5] p-3 rounded-md flex items-center justify-between gap-3 mt-4">
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Nội dung chuyển khoản chính xác</span>
                        <div className="font-mono font-black text-[#4c6b54] text-lg select-all truncate mt-0.5">
                          {order.transferContent}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-[#ebdcb9] hover:bg-[#ebdcb9]/40 text-[#4c6b54] font-bold shrink-0 shadow-sm"
                        onClick={handleCopyTransferContent}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>

                  </div>
                </div>

                <Separator className="bg-[#e6dfd3]" />

                {/* Countdown and Waiting loader */}
                <div className="bg-[#ebdcb9]/20 border border-[#ebdcb9]/60 rounded-md p-4 space-y-3.5 text-center">
                  
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

                  <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-[#4c6b54] bg-[#ebdcb9]/40 py-2.5 px-4 rounded-md inline-flex max-w-full">
                    <Loader2 className="h-4 w-4 animate-spin text-[#4c6b54]" />
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
            <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 shadow-sm rounded-md">
              <CardContent className="p-8 text-center font-sans space-y-5">
                <div className="size-16 bg-[#ebf4ef] rounded-full flex items-center justify-center mx-auto border-2 border-[#d2e7dd]">
                  <CheckCircle className="h-10 w-10 text-[#3c6b41]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-[#4c6b54]">Thanh toán thành công!</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Giao dịch của bạn đã được đối soát thành công. Tài liệu hiện đã được mở khóa và lưu vào thư viện cá nhân của bạn.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
                  <Button className="bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] font-bold px-6 shadow-sm" onClick={() => router.push(`/documents/${slug}`)}>
                    Xem & Tải tài liệu
                  </Button>
                  <Button variant="outline" className="border-[#ebdcb9] hover:bg-[#ebdcb9]/40 text-[#4c6b54] font-bold" onClick={() => router.push('/profile/purchases')}>
                    Thư viện cá nhân
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

        </div>

        {/* RIGHT COLUMN: Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 shadow-sm rounded-md">
            <CardHeader className="pb-3 border-b border-[#e6dfd3]/60">
              <CardTitle className="text-lg text-[#483d31]">Tóm tắt đơn hàng</CardTitle>
              <CardDescription>Chi tiết tài liệu và tổng thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 font-sans">
              
              {/* Document Info Row with Compact Cover */}
              <div className="flex gap-3.5 items-start">
                
                {/* Book cover (thumbnail size) */}
                <div className="relative w-16 aspect-[1/1.38] shrink-0 overflow-hidden rounded shadow-[2px_2px_5px_rgba(0,0,0,0.12)] border border-[#2d2d2d]/10 bg-[#fcf9f2]">
                  {doc.previewImages?.[0] ? (
                    <img src={doc.previewImages[0]} alt={doc.title} className="w-full h-full object-cover" />
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
                  <p className="text-sm font-bold text-[#483d31] line-clamp-2 leading-snug" title={doc.title}>
                    {doc.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground italic">Tác giả: {doc.author || 'Khuyết danh'}</p>
                  <Badge variant="outline" className="mt-1.5 text-[10px] py-0 px-1.5 font-bold uppercase tracking-wider text-stone-600 bg-stone-100 border-[#ebdcb9]">
                    {doc.fileFormat.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-[#e6dfd3]" />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#8c7e6c]">Khách hàng:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#5a5045] truncate max-w-[150px]">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{billingForm.fullName || 'Chưa cập nhật'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8c7e6c]">Trạng thái:</span>
                  <Badge className={getStatusBadgeClass(step)}>
                    {checkoutSteps[stepIndex].label}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-[#e6dfd3]" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-sans">
                  <span className="text-[#8c7e6c]">Giá bán:</span>
                  <span className="font-semibold text-stone-700">{formatPrice(doc.price)}</span>
                </div>
                {doc.originalPrice && doc.originalPrice > doc.price && (
                  <div className="flex justify-between text-red-700">
                    <span className="text-[#8c7e6c]">Tiết kiệm:</span>
                    <span className="font-semibold">-{formatPrice(doc.originalPrice - doc.price)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span className="text-[#8c7e6c]">Giảm giá:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2.5 border-t border-dashed border-[#e6dfd3] mt-2">
                  <span className="text-base font-bold text-[#483d31]">Tổng cộng</span>
                  <span className="text-xl font-extrabold text-[#8e2929]">
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
