// src/app/profile/wallet/page.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { createDepositOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Landmark, QrCode, CheckCircle2 } from "lucide-react";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function WalletPage() {
  const { user, token, refreshProfile } = useAuthStore();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialBalanceRef = useRef<number | undefined>(undefined);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quick select amounts
  const presetAmounts = [20000, 50000, 100000, 200000, 500000];

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  useEffect(() => {
    // Update initial balance once user is loaded
    if (user?.balance !== undefined && initialBalanceRef.current === undefined) {
      initialBalanceRef.current = user.balance;
    }
  }, [user?.balance]);

  useEffect(() => {
    // Polling logic when qrCodeUrl is active
    if (qrCodeUrl && !isSuccess && token) {
      pollingIntervalRef.current = setInterval(async () => {
        await refreshProfile();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [qrCodeUrl, isSuccess, token, refreshProfile]);

  useEffect(() => {
    // Check if balance has increased
    if (
      qrCodeUrl &&
      user?.balance !== undefined &&
      initialBalanceRef.current !== undefined &&
      user.balance > initialBalanceRef.current
    ) {
      setIsSuccess(true);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      toast({
        title: "Nạp tiền thành công",
        description: `Số dư của bạn đã được cộng thêm ${formatPrice(user.balance - initialBalanceRef.current)}`,
        variant: "default",
      });
      // Reset after 5s
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => {
        setQrCodeUrl(null);
        setIsSuccess(false);
        setAmount("");
        initialBalanceRef.current = user.balance;
      }, 5000);
    }
  }, [user?.balance, qrCodeUrl, toast]);

  const handleDeposit = async () => {
    if (!token) return;
    const numAmount = parseInt(amount.replace(/\D/g, ""));
    if (isNaN(numAmount) || numAmount < 10000) {
      toast({
        title: "Số tiền không hợp lệ",
        description: "Vui lòng nạp tối thiểu 10.000 đ.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      initialBalanceRef.current = user?.balance;
      const order = await createDepositOrder(numAmount, token);
      setQrCodeUrl(order.qrCodeUrl);
      setOrderCode(order.orderCode);
    } catch (err) {
      toast({
        title: "Lỗi tạo đơn nạp tiền",
        description: toErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary">Ví cá nhân</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quản lý số dư tài khoản và nạp tiền để giao dịch tài liệu nhanh chóng.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left Col: Balance & Form */}
        <div className="space-y-6">
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary border border-primary/20">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Số dư khả dụng</p>
                  <p className="text-2xl font-black text-emerald-600 mt-0.5">
                    {user?.balance !== undefined ? formatPrice(user.balance) : "---"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm rounded-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base text-foreground">Yêu cầu nạp số dư</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Hệ thống tự động quét giao dịch đối soát tức thì qua SePay.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs uppercase tracking-wider font-semibold text-foreground">Số tiền muốn nạp (VNĐ)</Label>
                <Input
                  id="amount"
                  placeholder="Nhập số tiền tối thiểu 10.000 đ"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  disabled={!!qrCodeUrl}
                  className="bg-transparent border border-border text-foreground focus-visible:ring-ring font-bold"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    disabled={!!qrCodeUrl}
                    onClick={() => setAmount(preset.toString())}
                    className="border border-border hover:bg-accent text-primary font-bold text-xs rounded"
                  >
                    {preset.toLocaleString('vi-VN')} đ
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4 bg-muted/20">
              {!qrCodeUrl ? (
                <Button onClick={handleDeposit} disabled={loading || !amount} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-md shadow-sm">
                  {loading && <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />}
                  Tạo mã thanh toán QR
                </Button>
              ) : (
                <Button onClick={() => setQrCodeUrl(null)} variant="outline" className="w-full border border-destructive bg-transparent text-destructive font-bold hover:bg-destructive/10 py-5 rounded-md">
                  Hủy yêu cầu nạp tiền này
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right Col: QR Code */}
        <div className="w-full">
          {qrCodeUrl && (
            <Card className="border border-primary bg-card shadow-sm rounded-xl overflow-hidden ring-4 ring-primary/10">
              <CardHeader className="text-center pb-2 border-b border-border bg-muted/20">
                <CardTitle className="text-base text-primary">Quét mã VietQR chuyển khoản</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Mở ứng dụng ngân hàng của bạn quét mã để cộng tiền tự động
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-5">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                    <div className="size-16 bg-primary/10 border border-primary/20 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-600">Nạp tiền thành công!</h3>
                    <p className="text-xs text-muted-foreground mt-1">Số dư tài khoản của bạn đã được cập nhật thành công.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-3 rounded-md shadow-sm border border-border flex items-center justify-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code Nạp tiền" 
                        loading="lazy"
                        decoding="async"
                        className="w-52 h-52 object-contain"
                      />
                    </div>
                    
                    <div className="w-full bg-muted/50 border border-dashed border-border rounded-md p-3.5 text-center space-y-1">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Mã giao dịch / Nội dung CK</p>
                      <p className="text-lg font-mono font-black tracking-wider text-primary select-all">{orderCode}</p>
                    </div>

                    <div className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-4 py-2 rounded-md border border-amber-200">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-600" />
                      Đang chờ hệ thống ghi nhận thanh toán...
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!qrCodeUrl && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-md p-12 text-center bg-muted/10 min-h-[300px]">
              <QrCode className="h-14 w-14 mb-3 opacity-25 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Chờ khởi tạo giao dịch</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Mã QR ngân hàng VietQR sẽ hiển thị tại đây ngay sau khi bạn nhập số tiền và bấm nút tạo mã.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
