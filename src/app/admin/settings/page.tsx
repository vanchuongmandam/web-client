// src/app/admin/settings/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "@/stores/auth.store";
import { getAdminSettings, updateContactSettings } from "@/lib/api";
import type { ContactSettings } from "@/lib/types";
import { toErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, PhoneCall, QrCode, ExternalLink } from "lucide-react";

const DEFAULT_CONTACT: ContactSettings = {
  phone: "0987352673",
  zaloName: "Văn Chương Mạn Đàm",
  defaultMessage: "",
  note: "",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContactSettings>(DEFAULT_CONTACT);

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/");
  }, [user, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getAdminSettings(token)
      .then((res) => setForm({ ...DEFAULT_CONTACT, ...res.contact }))
      .catch(() => {
        toast({ title: "Lỗi", description: "Không thể tải cấu hình", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [token, toast]);

  const handleChange = (field: keyof ContactSettings, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const zaloLink = form.phone.trim() ? `https://zalo.me/${form.phone.trim()}` : "";

  const handleSave = async () => {
    if (!token) return;
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      toast({
        title: "Số điện thoại không hợp lệ",
        description: "Số Zalo phải có dạng 0xxxxxxxxx",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const saved = await updateContactSettings(form, token);
      setForm({ ...DEFAULT_CONTACT, ...saved });
      toast({ title: "Đã lưu", description: "Cấu hình liên hệ đã được cập nhật." });
    } catch (err: unknown) {
      toast({
        title: "Lỗi lưu cấu hình",
        description: err instanceof Error ? toErrorMessage(err) : "Đã xảy ra lỗi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-earth">Cấu hình liên hệ & Hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý hotline Zalo chung cho toàn bộ tài liệu ở chế độ &quot;Chỉ liên hệ&quot;.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-2 border-2 border-sand-light bg-warm-cream/70 rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-earth">
              <PhoneCall className="size-4 text-primary" /> Thông tin hotline Zalo
            </CardTitle>
            <CardDescription>Thay đổi số điện thoại bất kỳ lúc nào mà không cần sửa code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-semibold">Số điện thoại Zalo hotline *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="0987352673"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zaloName" className="font-semibold">Tên hiển thị / Đơn vị tiếp nhận</Label>
              <Input
                id="zaloName"
                value={form.zaloName ?? ""}
                onChange={(e) => handleChange("zaloName", e.target.value)}
                placeholder="Ban Quản Trị VCMD"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="defaultMessage" className="font-semibold">Lời chào / Gợi ý tin nhắn Zalo</Label>
              <Textarea
                id="defaultMessage"
                value={form.defaultMessage ?? ""}
                onChange={(e) => handleChange("defaultMessage", e.target.value)}
                placeholder="Xin chào, tôi muốn trao đổi về tài liệu..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="font-semibold">Ghi chú hỗ trợ</Label>
              <Textarea
                id="note"
                value={form.note ?? ""}
                onChange={(e) => handleChange("note", e.target.value)}
                placeholder="Thời gian trực, lưu ý..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-primary text-primary-foreground hover:bg-wine-dark rounded-md font-semibold"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Lưu cấu hình
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="border-2 border-sand-light bg-warm-cream/70 rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-earth">
              <QrCode className="size-4 text-primary" /> Xem trước mã QR Zalo
            </CardTitle>
            <CardDescription>Được sinh tự động theo số điện thoại hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="rounded-lg border-2 border-sand bg-white p-4">
              {zaloLink ? (
                <QRCodeSVG value={zaloLink} size={184} level="M" marginSize={1} />
              ) : (
                <div className="flex h-[184px] w-[184px] items-center justify-center text-xs text-earth-muted">
                  Nhập số điện thoại hợp lệ
                </div>
              )}
            </div>

            <div className="w-full space-y-2 text-center">
              <p className="text-sm font-semibold text-earth">{form.zaloName || "Chưa đặt tên"}</p>
              <p className="text-xs text-earth-muted">{form.phone || "—"}</p>
              <Badge variant="outline" className="rounded-sm border-sand text-[10px] font-semibold text-primary">
                zalo.me/{form.phone || "..."}
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-sand bg-warm-cream text-xs font-semibold text-earth hover:text-primary"
              onClick={() => zaloLink && window.open(zaloLink, "_blank", "noopener,noreferrer")}
              disabled={!zaloLink}
            >
              <ExternalLink className="size-3.5" />
              Kiểm tra đường link Zalo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
