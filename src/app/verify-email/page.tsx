"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail, resendVerification } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const pending = searchParams.get("pending");
  const email = searchParams.get("email");
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (pending === "true") {
      setStatus("pending");
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage("Liên kết xác minh không hợp lệ hoặc bị thiếu.");
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Xác minh email thất bại.");
      }
    };

    verify();
  }, [token, pending, router]);

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập lại để gửi email xác minh.",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      await resendVerification(email);
      toast({
        title: "Đã gửi lại email",
        description: "Vui lòng kiểm tra hộp thư của bạn.",
      });
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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
      <Card className="max-w-md w-full text-center rounded-xl shadow-xs border border-border">
        <CardHeader className="space-y-4 pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-8 w-8 text-green-500" />}
            {status === "error" && <XCircle className="h-8 w-8 text-destructive" />}
            {status === "pending" && <Mail className="h-8 w-8 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-sans">
            {status === "loading" && "Đang xác minh email..."}
            {status === "success" && "Xác minh thành công!"}
            {status === "error" && "Xác minh thất bại"}
            {status === "pending" && "Kiểm tra email của bạn"}
          </CardTitle>
          <CardDescription className="text-base">
            {status === "loading" && "Vui lòng đợi trong giây lát."}
            {status === "success" && "Email của bạn đã được xác minh. Đang chuyển hướng đến trang đăng nhập..."}
            {status === "error" && errorMessage}
            {status === "pending" && "Chúng tôi đã gửi một liên kết xác minh đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam) và nhấp vào liên kết để kích hoạt tài khoản."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-3">
          {status === "error" && (
            <Button variant="outline" className="w-full" onClick={handleResend} disabled={resending || !email}>
              {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gửi lại email xác minh
            </Button>
          )}
          {status !== "loading" && (
            <Button asChild className="w-full" variant={status === "success" ? "default" : "secondary"}>
              <Link href="/login">Đi đến trang đăng nhập</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
