// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile } from "@/lib/api";
import type { UserProfile, BillingAddress } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Landmark, Share2, Wallet, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function ProfilePage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositing, setDepositing] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    penName: "",
    email: "",
    phone: "",
    bio: "",
    workPlace: "",
    subRole: "reader" as "student" | "teacher" | "author" | "reader",
  });

  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const [socialForm, setSocialForm] = useState({
    facebook: "",
    website: "",
    github: "",
  });

  const [billingForm, setBillingForm] = useState<BillingAddress>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "VN",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate displayName
    if (!form.displayName.trim()) {
      newErrors.displayName = "Họ và tên không được để trống.";
    }

    // Validate email
    if (!form.email.trim()) {
      newErrors.email = "Email liên hệ không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = "Email không đúng định dạng (ví dụ: name@example.com).";
      }
    }

    // Validate Bank Info (optional, but if one is filled, all are required)
    const hasAnyBankField = bankForm.bankName.trim() || bankForm.accountNumber.trim() || bankForm.accountName.trim();
    if (hasAnyBankField) {
      if (!bankForm.bankName.trim()) {
        newErrors.bankName = "Vui lòng nhập tên ngân hàng.";
      }
      if (!bankForm.accountNumber.trim()) {
        newErrors.accountNumber = "Vui lòng nhập số tài khoản.";
      }
      if (!bankForm.accountName.trim()) {
        newErrors.accountName = "Vui lòng nhập tên chủ tài khoản.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = () => {
    if (!profile) return false;

    // Check basic info
    if (form.displayName !== (profile.displayName || "")) return true;
    if (form.penName !== (profile.penName || "")) return true;
    if (form.email !== (profile.email || "")) return true;
    if (form.phone !== (profile.phone || "")) return true;
    if (form.bio !== (profile.bio || "")) return true;
    if (form.workPlace !== (profile.workPlace || "")) return true;
    if (form.subRole !== (profile.subRole || "reader")) return true;

    // Check bank info
    const originalBank = profile.bankInfo || {};
    if (bankForm.bankName !== (originalBank.bankName || "")) return true;
    if (bankForm.accountNumber !== (originalBank.accountNumber || "")) return true;
    if (bankForm.accountName !== (originalBank.accountName || "")) return true;

    // Check social links
    const originalSocial = profile.socialLinks || {};
    if (socialForm.facebook !== (originalSocial.facebook || "")) return true;
    if (socialForm.website !== (originalSocial.website || "")) return true;
    if (socialForm.github !== (originalSocial.github || "")) return true;

    // Check billing address
    const originalBilling = profile.billingAddress || {};
    if (billingForm.fullName !== (originalBilling.fullName || "")) return true;
    if (billingForm.phone !== (originalBilling.phone || "")) return true;
    if (billingForm.addressLine1 !== (originalBilling.addressLine1 || "")) return true;
    if (billingForm.addressLine2 !== (originalBilling.addressLine2 || "")) return true;
    if (billingForm.city !== (originalBilling.city || "")) return true;
    if (billingForm.province !== (originalBilling.province || "")) return true;
    if (billingForm.postalCode !== (originalBilling.postalCode || "")) return true;
    if (billingForm.country !== (originalBilling.country || "VN")) return true;

    return false;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    getProfile(token)
      .then((p) => {
        setProfile(p);
        setForm({
          displayName: p.displayName || "",
          penName: p.penName || "",
          email: p.email || "",
          phone: p.phone || "",
          bio: p.bio || "",
          workPlace: p.workPlace || "",
          subRole: p.subRole || "reader",
        });

        if (p.bankInfo) {
          setBankForm({
            bankName: p.bankInfo.bankName || "",
            accountNumber: p.bankInfo.accountNumber || "",
            accountName: p.bankInfo.accountName || "",
          });
        }

        if (p.socialLinks) {
          setSocialForm({
            facebook: p.socialLinks.facebook || "",
            website: p.socialLinks.website || "",
            github: p.socialLinks.github || "",
          });
        }

        if (p.billingAddress) {
          setBillingForm(p.billingAddress);
        }
      })
      .catch(() =>
        toast({ title: "Lỗi", description: "Không thể tải thông tin", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [authLoading, token, router, toast]);

  const handleSave = async () => {
    if (!token) return;

    if (!validateForm()) {
      toast({
        title: "Thông tin chưa hợp lệ",
        description: "Vui lòng kiểm tra lại các trường thông tin bắt buộc.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({
        ...form,
        bankInfo: bankForm,
        socialLinks: socialForm,
        billingAddress: billingForm,
      }, token);
      setProfile(updated);
      toast({ title: "Đã lưu", description: "Cập nhật thông tin thành công." });
      
      // Reload profile properties
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể lưu thông tin",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMockDeposit = async () => {
    if (!token || !profile) return;
    setDepositing(true);
    try {
      const currentBalance = profile.balance || 0;
      const updated = await updateProfile({ balance: currentBalance + 200000 }, token);
      setProfile(updated);
      toast({
        title: "Nạp tiền thành công",
        description: "Đã cộng thêm 200.000đ test vào tài khoản của bạn.",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi nạp tiền",
        description: err.message || "Không thể thực hiện nạp tiền thử nghiệm.",
        variant: "destructive",
      });
    } finally {
      setDepositing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-card/70 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subRoleLabels: Record<string, string> = {
    reader: "Độc giả",
    author: "Tác giả",
    teacher: "Giáo viên",
    student: "Học sinh",
  };

  const currentSubRole = profile?.subRole || "reader";

  return (
    <div className="space-y-8 font-sans">
      
      {/* 4 Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: User Info */}
        <Card className="bg-card border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-primary/5 group-hover:text-primary/10 transition-colors">
            <User className="h-12 w-12" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Thông tin cơ bản</p>
              <h3 className="text-sm font-bold text-foreground truncate">{profile?.penName || profile?.displayName || user?.username}</h3>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-2">{profile?.email || "Chưa thiết lập email"}</p>
          </CardContent>
        </Card>

        {/* Card 2: Account Balance */}
        <Card className="bg-card border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-emerald-600/5 group-hover:text-emerald-600/10 transition-colors">
            <Wallet className="h-12 w-12" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Số dư ví của bạn</p>
              <h3 className="text-lg font-black text-emerald-600">
                {formatPrice(profile?.balance || 0)}
              </h3>
            </div>
            <div className="flex gap-1.5 mt-2">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[9px] py-1 px-2 h-6.5 rounded"
                onClick={() => router.push("/profile/wallet")}
              >
                + Nạp tiền
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border bg-background text-primary font-bold hover:bg-accent text-[9px] py-1 px-2 h-6.5 rounded"
                onClick={handleMockDeposit}
                disabled={depositing}
              >
                {depositing ? "Đang nạp..." : "Nạp test (+200k)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Security Status */}
        <Card className="bg-card border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-primary/5 group-hover:text-primary/10 transition-colors">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bảo mật tài khoản</p>
              <div className="space-y-0.5 mt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Passkeys:</span>
                  <span className="text-red-700 font-bold">Chưa kích hoạt</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Mật khẩu 2FA:</span>
                  <span className="text-red-700 font-bold">Chưa kích hoạt</span>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground mt-2 font-medium">Cấp độ: Tiêu chuẩn</div>
          </CardContent>
        </Card>

        {/* Card 4: System Role */}
        <Card className="bg-card border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-primary/5 group-hover:text-primary/10 transition-colors">
            <User className="h-12 w-12" />
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Vai trò hệ thống</p>
              <h3 className="text-xs font-bold text-foreground capitalize">{subRoleLabels[currentSubRole] || "Người dùng"}</h3>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 font-medium">Quyền hạn: Tiêu chuẩn</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Sections */}
      <div className="space-y-8 pt-4 border-t border-border/40">
        
        {/* Personal Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-primary shrink-0" />
              Thông tin cá nhân
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cập nhật thông tin tài khoản, tên hiển thị, bút danh diễn đàn và giới thiệu ngắn về bản thân. Trường có dấu <span className="text-red-600 font-bold">*</span> là bắt buộc.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Tên đăng nhập</Label>
                  <Input
                    value={profile?.username || ""}
                    disabled
                    className="h-9 bg-muted/50 border-border/50 text-muted-foreground/70 font-mono text-xs cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">
                    Họ và tên <span className="text-red-600 font-bold ml-0.5">*</span>
                  </Label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => {
                      setForm({ ...form, displayName: e.target.value });
                      if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: "" }));
                    }}
                    className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                      errors.displayName
                        ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                        : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                    }`}
                  />
                  {errors.displayName && (
                    <p className="text-red-700 text-[10px] font-semibold mt-1">{errors.displayName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Bút danh (Hiển thị diễn đàn)</Label>
                  <Input
                    value={form.penName}
                    onChange={(e) => setForm({ ...form, penName: e.target.value })}
                    placeholder="Ví dụ: Phù Sa"
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">
                    Email liên hệ <span className="text-red-600 font-bold ml-0.5">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                      errors.email
                        ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                        : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-700 text-[10px] font-semibold mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Số điện thoại</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Vai trò diễn đàn</Label>
                  <Select
                    value={form.subRole}
                    onValueChange={(val: any) => setForm({ ...form, subRole: val })}
                  >
                    <SelectTrigger className="h-9 bg-background/50 border-border/60 text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-popover-foreground">
                      <SelectItem value="reader">Độc giả (Reader)</SelectItem>
                      <SelectItem value="author">Tác giả (Author)</SelectItem>
                      <SelectItem value="teacher">Giáo viên (Teacher)</SelectItem>
                      <SelectItem value="student">Học sinh (Student)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Đơn vị công tác / Trường học</Label>
                  <Input
                    value={form.workPlace}
                    onChange={(e) => setForm({ ...form, workPlace: e.target.value })}
                    placeholder="Ví dụ: Trường THPT Chu Văn An"
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Giới thiệu bản thân</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    maxLength={500}
                    rows={3}
                    placeholder="Viết một đoạn ngắn giới thiệu về bạn..."
                    className="bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Config Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5 text-primary shrink-0" />
              Cấu hình nhận thanh toán
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thông tin nhận tiền doanh thu khi người khác mua tài liệu hoặc ủng hộ tác phẩm của bạn. Nếu điền, vui lòng nhập đầy đủ cả 3 thông tin.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">
                    Tên ngân hàng {bankForm.accountNumber.trim() || bankForm.accountName.trim() ? <span className="text-red-600 font-bold ml-0.5">*</span> : null}
                  </Label>
                  <Input
                    value={bankForm.bankName}
                    onChange={(e) => {
                      setBankForm({ ...bankForm, bankName: e.target.value });
                      if (errors.bankName) setErrors((prev) => ({ ...prev, bankName: "" }));
                    }}
                    placeholder="Ví dụ: MBBank"
                    className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                      errors.bankName
                        ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                        : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                    }`}
                  />
                  {errors.bankName && (
                    <p className="text-red-700 text-[10px] font-semibold mt-1">{errors.bankName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">
                    Số tài khoản {bankForm.bankName.trim() || bankForm.accountName.trim() ? <span className="text-red-600 font-bold ml-0.5">*</span> : null}
                  </Label>
                  <Input
                    value={bankForm.accountNumber}
                    onChange={(e) => {
                      setBankForm({ ...bankForm, accountNumber: e.target.value });
                      if (errors.accountNumber) setErrors((prev) => ({ ...prev, accountNumber: "" }));
                    }}
                    placeholder="Ví dụ: 0123456789"
                    className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                      errors.accountNumber
                        ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                        : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                    }`}
                  />
                  {errors.accountNumber && (
                    <p className="text-red-700 text-[10px] font-semibold mt-1">{errors.accountNumber}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">
                    Chủ tài khoản (Không dấu) {bankForm.bankName.trim() || bankForm.accountNumber.trim() ? <span className="text-red-600 font-bold ml-0.5">*</span> : null}
                  </Label>
                  <Input
                    value={bankForm.accountName}
                    onChange={(e) => {
                      setBankForm({ ...bankForm, accountName: e.target.value });
                      if (errors.accountName) setErrors((prev) => ({ ...prev, accountName: "" }));
                    }}
                    placeholder="Ví dụ: NGUYEN THANG LONG"
                    className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                      errors.accountName
                        ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                        : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                    }`}
                  />
                  {errors.accountName && (
                    <p className="text-red-700 text-[10px] font-semibold mt-1">{errors.accountName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Links Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Share2 className="h-4.5 w-4.5 text-primary shrink-0" />
              Liên kết mạng xã hội
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Liên kết tài khoản mạng xã hội để người đọc dễ kết nối với bạn hơn.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Facebook URL</Label>
                  <Input
                    value={socialForm.facebook}
                    onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })}
                    placeholder="facebook.com/..."
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Website cá nhân</Label>
                  <Input
                    value={socialForm.website}
                    onChange={(e) => setSocialForm({ ...socialForm, website: e.target.value })}
                    placeholder="yourwebsite.com"
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">GitHub</Label>
                  <Input
                    value={socialForm.github}
                    onChange={(e) => setSocialForm({ ...socialForm, github: e.target.value })}
                    placeholder="github.com/..."
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Default Billing Address Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-4.5 w-4.5 text-primary shrink-0" />
              Địa chỉ thanh toán mặc định
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dùng tự động điền khi tạo hóa đơn hoặc tải tài liệu.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Họ và tên người nhận</Label>
                  <Input
                    value={billingForm.fullName || ""}
                    onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })}
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Số điện thoại nhận</Label>
                  <Input
                    value={billingForm.phone || ""}
                    onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Tỉnh / Thành phố</Label>
                  <Input
                    value={billingForm.province || ""}
                    onChange={(e) => setBillingForm({ ...billingForm, province: e.target.value })}
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Quận / Huyện</Label>
                  <Input
                    value={billingForm.city || ""}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground/80">Địa chỉ cụ thể (Số nhà, Tên đường)</Label>
                  <Input
                    value={billingForm.addressLine1 || ""}
                    onChange={(e) => setBillingForm({ ...billingForm, addressLine1: e.target.value })}
                    className="h-9 bg-background/50 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Button Submit */}
      <div className="flex justify-end pt-4 border-t border-border/40">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 shadow-sm rounded-md"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu thay đổi
        </Button>
      </div>



    </div>
  );
}
