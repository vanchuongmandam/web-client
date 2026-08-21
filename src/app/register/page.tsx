// src/app/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Chrome } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Quy tắc username: 3-30 ký tự, chỉ chữ cái Latinh không dấu, số, `_`, `-`, `.`, không khoảng trắng.
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

function validateUsername(value: string): string | null {
  if (!value) return "Tên người dùng không được để trống.";
  if (value.length < 3 || value.length > 30) {
    return "Tên người dùng phải từ 3 đến 30 ký tự.";
  }
  if (/\s/.test(value)) {
    return "Tên người dùng không được chứa khoảng trắng.";
  }
  if (!USERNAME_REGEX.test(value)) {
    return "Tên người dùng chỉ được chứa chữ cái không dấu, chữ số, dấu gạch dưới (_), gạch ngang (-) hoặc dấu chấm (.).";
  }
  return null;
}

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { register, loginWithGoogle, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();

  // Xóa lỗi khi người dùng rời khỏi trang hoặc component unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError) setUsernameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldError = validateUsername(username);
    if (fieldError) {
      setUsernameError(fieldError);
      return;
    }
    try {
      await register(username, password, email);
      router.push('/verify-email?pending=true');
    } catch (err) {
      // Bắt lỗi được ném từ auth store để ngăn các hành động tiếp theo
      console.error("Registration failed:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-sans">Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản để thảo luận và lưu lại các bài viết yêu thích.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nguyenvan_a@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Tên người dùng</Label>
              <Input
                id="username"
                placeholder="nguyenvan_a"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!usernameError}
                aria-describedby={usernameError ? "username-error" : undefined}
              />
              {usernameError && (
                <p id="username-error" className="text-sm text-destructive">
                  {usernameError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                3–30 ký tự, không dấu, không khoảng trắng. Cho phép chữ, số, _ - .
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
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
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Tạo tài khoản'}
            </Button>
            
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">hoặc</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={loginWithGoogle} disabled={isLoading}>
              <Chrome className="mr-2 h-4 w-4" /> Đăng ký bằng Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Đã có tài khoản?{" "}
            <Link href="/login" className="underline" onClick={clearError}>
              Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
