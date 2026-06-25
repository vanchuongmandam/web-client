// src/app/profile/security/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  KeyRound, 
  Fingerprint, 
  Smartphone, 
  ShieldCheck, 
  ShieldAlert,
  Loader2, 
  Trash2, 
  Plus, 
  Copy,
  QrCode,
  Chrome,
  Link as LinkIcon,
  CheckCircle2
} from "lucide-react";

interface PasskeyItem {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string;
}

export default function SecurityPage() {
  const { toast } = useToast();
  const { user, isOAuth, token } = useAuth();

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Passkey States
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([
    { id: "1", name: "Windows Hello (Google Chrome)", createdAt: "20/06/2026 14:32", lastUsed: "Hôm nay, 10:15" }
  ]);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeyStep, setPasskeyStep] = useState<"idle" | "requesting" | "success">("idle");
  const [customPasskeyName, setCustomPasskeyName] = useState("");

  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<"scan" | "success">("scan");
  
  const mockSecretKey = "VCMD HY3D 8YSU Q82K 71ND P94L";

  // Password validation & save simulation
  const handleSavePassword = async () => {
    const errors: Record<string, string> = {};
    if (!isOAuth && !currentPassword) errors.currentPassword = "Mật khẩu hiện tại không được để trống.";
    if (!newPassword) {
      errors.newPassword = "Mật khẩu mới không được để trống.";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải chứa ít nhất 6 ký tự.";
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Xác nhận mật khẩu mới không trùng khớp.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      toast({
        title: "Dữ liệu không hợp lệ",
        description: "Vui lòng điền đúng thông tin đổi mật khẩu.",
        variant: "destructive"
      });
      return;
    }

    setPasswordErrors({});
    setSavingPassword(true);
    
    try {
      if (!token) throw new Error("Chưa đăng nhập");
      await changePassword({ 
        currentPassword: isOAuth ? undefined : currentPassword, 
        newPassword 
      }, token);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Đã đổi mật khẩu",
        description: "Mật khẩu tài khoản của bạn đã được cập nhật thành công."
      });
    } catch (err: any) {
      toast({
        title: "Lỗi đổi mật khẩu",
        description: err.message || "Vui lòng thử lại sau",
        variant: "destructive"
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Passkey mock simulation
  const startRegisterPasskey = () => {
    setRegisteringPasskey(true);
    setPasskeyStep("requesting");
    setCustomPasskeyName("");

    // Step 2: Simulate biometric confirmation prompt
    setTimeout(() => {
      setPasskeyStep("success");
    }, 2500);
  };

  const finalizePasskeyRegistration = () => {
    const keyName = customPasskeyName.trim() || `Thiết bị bảo mật #${passkeys.length + 1}`;
    const newKey: PasskeyItem = {
      id: Date.now().toString(),
      name: keyName,
      createdAt: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
      lastUsed: "Vừa mới đăng ký"
    };
    setPasskeys([newKey, ...passkeys]);
    setRegisteringPasskey(false);
    setPasskeyStep("idle");
    toast({
      title: "Đăng ký thành công",
      description: `Thiết bị khóa bảo mật "${keyName}" đã được liên kết với tài khoản.`
    });
  };

  const handleDeletePasskey = (id: string, name: string) => {
    setPasskeys(passkeys.filter(k => k.id !== id));
    toast({
      title: "Đã hủy liên kết",
      description: `Khóa bảo mật "${name}" đã bị xóa.`
    });
  };

  // 2FA mock simulation
  const handleVerify2FA = () => {
    if (totpCode.length !== 6 || isNaN(Number(totpCode))) {
      toast({
        title: "Mã OTP không hợp lệ",
        description: "Mã số phải chứa đúng 6 chữ số.",
        variant: "destructive"
      });
      return;
    }

    setVerifying2FA(true);
    setTimeout(() => {
      setVerifying2FA(false);
      setTwoFAStep("success");
    }, 1500);
  };

  const enable2FA = () => {
    setIs2FAEnabled(true);
    setShow2FADialog(false);
    setTotpCode("");
    setTwoFAStep("scan");
    toast({
      title: "Kích hoạt 2FA thành công",
      description: "Xác thực 2 yếu tố đã được thiết lập cho tài khoản của bạn."
    });
  };

  const disable2FA = () => {
    setIs2FAEnabled(false);
    toast({
      title: "Đã tắt 2FA",
      description: "Tài khoản của bạn đã tắt tính năng xác thực hai lớp."
    });
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mockSecretKey);
    toast({
      title: "Đã sao chép",
      description: "Đã sao chép mã khóa bí mật vào khay nhớ tạm."
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary">Mật khẩu & Bảo mật</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quản lý khóa bảo mật, cài đặt đổi mật khẩu và thiết lập đăng nhập hai yếu tố.
        </p>
      </div>

      <div className="space-y-8 pt-4 border-t border-border/40">
        
        {/* Section 1: Change Password */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-primary shrink-0" />
              Đổi mật khẩu
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mật khẩu phải dài ít nhất 6 ký tự. Hãy đổi định kỳ để bảo vệ quyền truy cập tài khoản của bạn.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="space-y-4">
                {!isOAuth && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground/80">Mật khẩu hiện tại</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: "" }));
                      }}
                      className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                        passwordErrors.currentPassword
                          ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                          : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-red-700 text-[10px] font-semibold mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground/80">Mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: "" }));
                      }}
                      className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                        passwordErrors.newPassword
                          ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                          : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-700 text-[10px] font-semibold mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground/80">Xác nhận mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }}
                      className={`h-9 bg-background/50 text-foreground text-sm transition-all focus-visible:ring-1 ${
                        passwordErrors.confirmPassword
                          ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                          : "border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-700 text-[10px] font-semibold mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSavePassword}
                    disabled={savingPassword}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4 text-xs shadow-sm rounded-md"
                  >
                    {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 1.5: Google Linked Account */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <LinkIcon className="h-4.5 w-4.5 text-primary shrink-0" />
              Tài khoản liên kết
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quản lý các tài khoản mạng xã hội được liên kết để đăng nhập nhanh.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between p-3 bg-background/40 border border-border/50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-md">
                    <Chrome className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Google</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {isOAuth ? "Đã liên kết" : "Chưa liên kết"}
                    </p>
                  </div>
                </div>
                {isOAuth ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">Đã kết nối</span>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Liên kết</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Passkeys */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Fingerprint className="h-4.5 w-4.5 text-primary shrink-0" />
              Khóa bảo mật (Passkeys)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thiết lập đăng nhập không mật khẩu cực kỳ an toàn bằng cảm biến sinh trắc học hoặc mã PIN bảo mật phần cứng trên thiết bị.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Thiết bị đã liên kết</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Danh sách các thiết bị được phép đăng nhập nhanh qua vân tay/face.</p>
                </div>
                <Button
                  onClick={startRegisterPasskey}
                  className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-bold h-8 px-3 text-xs rounded-md"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Thêm khóa mới
                </Button>
              </div>

              {passkeys.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs italic bg-muted/10 border border-dashed rounded-md">
                  Chưa có khóa bảo mật nào được thiết lập trên tài khoản này.
                </div>
              ) : (
                <div className="space-y-3">
                  {passkeys.map((key) => (
                    <div 
                      key={key.id}
                      className="flex items-center justify-between p-3 bg-background/40 border border-border/50 rounded-md hover:border-border transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-md">
                          <Fingerprint className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{key.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Đăng ký: {key.createdAt} • Sử dụng cuối: {key.lastUsed}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePasskey(key.id, key.name)}
                        className="text-muted-foreground hover:text-red-700 hover:bg-red-50 hover:border-red-100 h-8 w-8 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section 3: 2FA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          <div className="space-y-1.5 lg:pr-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Smartphone className="h-4.5 w-4.5 text-primary shrink-0" />
              Xác thực 2 yếu tố (2FA)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tạo lớp bảo mật thứ hai bằng ứng dụng như Google Authenticator hoặc Microsoft Authenticator mỗi khi bạn tiến hành đăng nhập.
            </p>
          </div>
          
          <Card className="lg:col-span-2 bg-card border border-border/80 shadow-sm rounded-md">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-3 border rounded-md ${
                    is2FAEnabled 
                      ? "bg-green-600/10 border-green-600/20 text-green-700" 
                      : "bg-amber-600/10 border-amber-600/20 text-amber-700"
                  }`}>
                    {is2FAEnabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">Bảo mật hai lớp Authenticator</h4>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                        is2FAEnabled 
                          ? "bg-green-600/10 border-green-600/20 text-green-700" 
                          : "bg-stone-100 border-stone-200 text-stone-500"
                      }`}>
                        {is2FAEnabled ? "ĐÃ BẬT" : "CHƯA BẬT"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                      Mã đăng nhập dùng một lần (OTP) sẽ được sinh ra từ ứng dụng Authenticator trên điện thoại của bạn khi bạn đăng nhập tài khoản.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  {is2FAEnabled ? (
                    <Button
                      onClick={disable2FA}
                      variant="outline"
                      className="border border-red-200 text-red-700 bg-transparent hover:bg-red-50 font-bold h-9 px-4 text-xs rounded-md w-full sm:w-auto"
                    >
                      Tắt bảo mật 2FA
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShow2FADialog(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4 text-xs rounded-md w-full sm:w-auto shadow-sm"
                    >
                      Bắt đầu thiết lập
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Dialog for Passkey Simulator */}
      <Dialog open={registeringPasskey} onOpenChange={setRegisteringPasskey}>
        <DialogContent className="bg-popover border border-border text-popover-foreground sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold text-primary flex items-center justify-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" /> Thiết lập Khóa bảo mật
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Thiết lập thiết bị bảo mật sinh trắc học để đăng nhập nhanh không cần mật khẩu.
            </DialogDescription>
          </DialogHeader>

          {passkeyStep === "requesting" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center text-primary">
                  <Fingerprint className="h-10 w-10 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin h-16 w-16"></div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-foreground">Đang yêu cầu kết nối với thiết bị...</p>
                <p className="text-[10px] text-muted-foreground max-w-[280px]">
                  Vui lòng quét vân tay, nhận diện khuôn mặt hoặc nhập mã PIN của thiết bị bảo mật trong hộp thoại trình duyệt.
                </p>
              </div>
            </div>
          )}

          {passkeyStep === "success" && (
            <div className="py-4 space-y-4">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">Thiết bị bảo mật được duyệt!</h3>
                <p className="text-[10px] text-muted-foreground max-w-[280px]">
                  Xác thực vân tay/khóa trên thiết bị hoàn tất. Vui lòng đặt tên cho khóa bảo mật này để quản lý.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold text-muted-foreground/80">Tên khóa bảo mật</Label>
                <Input
                  value={customPasskeyName}
                  onChange={(e) => setCustomPasskeyName(e.target.value)}
                  placeholder="Ví dụ: MacBook Pro vân tay, Chrome Windows..."
                  className="h-9 bg-background border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={finalizePasskeyRegistration}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4 text-xs rounded-md"
                >
                  Hoàn tất và kích hoạt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for 2FA Simulator */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="bg-popover border border-border text-popover-foreground sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" /> Cài đặt Xác thực 2 yếu tố
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Thiết lập Authenticator để bảo vệ tài khoản khi đăng nhập.
            </DialogDescription>
          </DialogHeader>

          {twoFAStep === "scan" && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-muted/40 border border-border/50 rounded-md">
                <div className="bg-white p-2.5 rounded-md border flex items-center justify-center shrink-0">
                  {/* Mock QR Code representation */}
                  <QrCode className="h-28 w-28 text-stone-900" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-foreground">Bước 1: Quét mã QR</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Mở ứng dụng Authenticator của bạn (Google Authenticator, Authy, Microsoft...) và thực hiện quét mã QR bên cạnh.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hoặc nhập mã khóa thủ công</Label>
                  <Button 
                    variant="ghost" 
                    className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 font-semibold"
                    onClick={handleCopySecret}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Sao chép
                  </Button>
                </div>
                <div className="p-2.5 bg-background border border-border/80 rounded-md text-xs font-mono font-bold select-all tracking-wider text-center text-primary">
                  {mockSecretKey}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <Label className="text-xs font-semibold text-muted-foreground/80">Bước 2: Nhập mã xác minh gồm 6 số</Label>
                <Input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.substring(0, 6))}
                  placeholder="Nhập mã OTP 6 số từ ứng dụng..."
                  className="h-9 bg-background border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm text-center font-mono font-bold tracking-widest"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShow2FADialog(false)}
                  className="border border-border hover:bg-accent font-semibold h-9 px-4 text-xs rounded-md"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleVerify2FA}
                  disabled={verifying2FA || totpCode.length !== 6}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4 text-xs rounded-md"
                >
                  {verifying2FA && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác minh và Bật 2FA
                </Button>
              </div>
            </div>
          )}

          {twoFAStep === "success" && (
            <div className="py-2 space-y-4">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">Đã bật xác thực 2 yếu tố!</h3>
                <p className="text-[10px] text-muted-foreground max-w-[320px]">
                  Tài khoản của bạn đã được tăng cường bảo mật. Lưu lại các mã dự phòng sau đây để khôi phục tài khoản khi mất điện thoại.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-md p-3.5 space-y-2 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Mã khôi phục dự phòng (Recovery Codes)</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold text-stone-700 pt-1">
                  <div>VCMD-9A82-10FF</div>
                  <div>VCMD-88B3-CC12</div>
                  <div>VCMD-51D9-AA38</div>
                  <div>VCMD-FF40-7711</div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={enable2FA}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-6 text-xs rounded-md w-full"
                >
                  Tôi đã lưu lại mã và hoàn tất
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
