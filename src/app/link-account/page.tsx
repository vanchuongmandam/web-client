"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { linkGoogleAccount } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon, Chrome } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

function LinkAccountContent() {
  const searchParams = useSearchParams();
  const idToken = searchParams.get("idToken");
  const router = useRouter();
  
  // Note: we can't use loginWithGoogle here, we need to manually update AuthContext
  // after calling linkGoogleAccount.
  const { login } = useAuth(); // We'll need a special method, or we can just use router.push after manual localStorage update, or add a method to AuthContext.
  // Actually, linkGoogleAccount returns LoginResponse (token, user).
  // We can just update localStorage and refresh the page, or let AuthContext pick it up.
  
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idToken) {
      setStatus("error");
      setErrorMessage("Thiếu Google Token.");
      return;
    }

    if (!password) {
      setStatus("error");
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const data = await linkGoogleAccount(idToken, password);
      // Success, manual login
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setStatus("success");
      // Force reload to let AuthContext pick up the new token
      window.location.href = '/';
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Mật khẩu không đúng. Không thể liên kết tài khoản.");
    }
  };

  if (!idToken) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
        <Card className="max-w-sm w-full shadow-lg border-muted">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center text-destructive">Lỗi</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Không tìm thấy phiên đăng nhập Google.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
      <Card className="max-w-sm w-full shadow-lg border-muted">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4 flex items-center justify-center relative">
            <Chrome className="h-6 w-6 text-primary" />
            <LinkIcon className="h-4 w-4 absolute -bottom-1 -right-1 text-muted-foreground bg-background rounded-full" />
          </div>
          <CardTitle className="text-2xl font-headline">Tài khoản đã tồn tại</CardTitle>
          <CardDescription>
            Email từ tài khoản Google này đã được đăng ký trước đó. Vui lòng nhập mật khẩu cũ để liên kết tài khoản Google của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {status === "error" && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu hiện tại</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={status === "loading" || status === "success"}
              />
            </div>

            <Button type="submit" className="w-full" disabled={status === "loading" || status === "success" || !password}>
              {status === "loading" || status === "success" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Liên kết tài khoản'}
            </Button>

            <Button asChild variant="ghost" className="w-full mt-2 text-muted-foreground">
              <Link href="/login">Hủy và quay lại</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LinkAccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <LinkAccountContent />
    </Suspense>
  );
}
