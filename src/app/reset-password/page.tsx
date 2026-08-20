"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setStatus("error");
      setErrorMessage("Liên kết không hợp lệ hoặc bị thiếu.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Mật khẩu không khớp.");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await resetPassword(token, password);
      setStatus("success");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Đã xảy ra lỗi khi đặt lại mật khẩu.");
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
        <Card className="max-w-sm w-full rounded-xl shadow-xs border border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-sans text-center text-destructive">Lỗi</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Liên kết đặt lại mật khẩu không hợp lệ hoặc bị thiếu.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Yêu cầu liên kết mới</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
      <Card className="max-w-sm w-full rounded-xl shadow-xs border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-sans text-center">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Thành công!</h3>
                <p className="text-sm text-muted-foreground">
                  Mật khẩu của bạn đã được đặt lại thành công. Đang chuyển hướng đến trang đăng nhập...
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/login">Đi đến trang đăng nhập ngay</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              {status === "error" && (
                <Alert variant="destructive">
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>

              <Button type="submit" className="w-full" disabled={status === "loading" || !password || !confirmPassword}>
                {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lưu mật khẩu mới
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
