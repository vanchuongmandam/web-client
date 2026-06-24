"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      await forgotPassword(email);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Đã xảy ra lỗi khi gửi email.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
      <Card className="max-w-sm w-full shadow-lg border-muted">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Quên mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Đã gửi email!</h3>
                <p className="text-sm text-muted-foreground">
                  Vui lòng kiểm tra hộp thư của bạn (bao gồm cả mục Spam) để đặt lại mật khẩu.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/login">Quay lại trang đăng nhập</Link>
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
                <Label htmlFor="email">Email đã đăng ký</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nguyenvan_a@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>

              <Button type="submit" className="w-full" disabled={status === "loading" || !email}>
                {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Gửi liên kết
              </Button>

              <Button asChild variant="ghost" className="w-full mt-2 text-muted-foreground">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
