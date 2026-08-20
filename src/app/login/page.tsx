// src/app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Chrome } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resending, setResending] = useState(false);
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleResendVerification = async () => {
    if (!username) return;
    setResending(true);
    try {
      await resendVerification(username);
      toast({
        title: "Đã gửi lại email",
        description: "Vui lòng kiểm tra hộp thư của bạn.",
      });
      clearError();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể gửi lại email",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const isUnverifiedError = error === "Please verify your email before logging in." || error === "Vui lòng xác minh email trước khi đăng nhập.";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-sans">Đăng nhập</CardTitle>
          <CardDescription>
            Nhập tên người dùng và mật khẩu của bạn để truy cập
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>
                  {error}
                  {isUnverifiedError && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full text-black"
                      onClick={handleResendVerification}
                      disabled={resending}
                      type="button"
                    >
                      {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Gửi lại email xác minh
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button variant="outline" type="button" className="w-full" onClick={loginWithGoogle} disabled={isLoading}>
              <Chrome className="mr-2 h-4 w-4" /> Đăng nhập bằng Google
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">hoặc</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Tên người dùng hoặc Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="ten_nguoi_dung"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Đăng nhập'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="underline">
              Đăng ký
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
