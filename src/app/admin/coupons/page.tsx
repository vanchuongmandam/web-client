"use client";

import { useEffect, useState } from "react";
import { 
  getAdminCoupons, 
  createAdminCoupon, 
  updateAdminCoupon, 
  deleteAdminCoupon,
  getAdminDocuments
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Coupon, MarketDocument } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Edit, Trash2, Tag, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAdminCoupons({ page, limit: 10 }, token);
      setCoupons(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tải danh sách mã giảm giá.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, token]);

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCode(coupon.code);
      setDiscountType(coupon.discountType);
      setDiscountValue(coupon.discountValue.toString());
      setMaxDiscountAmount(coupon.maxDiscountAmount?.toString() || "");
      setMinOrderAmount(coupon.minOrderAmount?.toString() || "0");
      setMaxUses(coupon.maxUses?.toString() || "");
      setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : "");
      setIsActive(coupon.isActive);
    } else {
      setEditingCoupon(null);
      setCode("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMaxDiscountAmount("");
      setMinOrderAmount("0");
      setMaxUses("");
      setExpiresAt("");
      setIsActive(true);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSubmitting(true);
    const payload = {
      code,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      minOrderAmount: Number(minOrderAmount),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isActive
    };

    try {
      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon._id, payload, token);
        toast({ title: "Thành công", description: "Đã cập nhật mã giảm giá." });
      } else {
        await createAdminCoupon(payload, token);
        toast({ title: "Thành công", description: "Đã tạo mã giảm giá mới." });
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;
    try {
      await deleteAdminCoupon(id, token);
      toast({ title: "Thành công", description: "Đã xóa mã giảm giá." });
      fetchCoupons();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" /> Mã giảm giá (Coupons)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tạo và quản lý các chương trình khuyến mãi
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Tạo mã mới
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã (Code)</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị giảm</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead>Hạn sử dụng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Chưa có mã giảm giá nào.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon._id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    {coupon.discountType === 'percentage' ? (
                      <span className="inline-flex items-center text-blue-600">
                        <Percent className="h-3 w-3 mr-1" /> Phần trăm
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-emerald-600">
                        Số tiền cố định
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discountValue}%` 
                      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.discountValue)
                    }
                    {coupon.maxDiscountAmount && <div className="text-xs text-muted-foreground">Tối đa: {coupon.maxDiscountAmount / 1000}k</div>}
                  </TableCell>
                  <TableCell>
                    {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                  </TableCell>
                  <TableCell>
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                  </TableCell>
                  <TableCell>
                    {coupon.isActive ? (
                      <span className="text-green-600 text-xs px-2 py-1 bg-green-50 rounded-full">Đang bật</span>
                    ) : (
                      <span className="text-gray-500 text-xs px-2 py-1 bg-gray-100 rounded-full">Đã tắt</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(coupon._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Trang trước
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {page} / {totalPages || 1}
        </span>
        <Button 
          variant="outline" 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading || totalPages === 0}
        >
          Trang tiếp
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Mã (Code)</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="VD: SUMMER20" />
              </div>
              <div className="grid gap-2">
                <Label>Loại giảm giá</Label>
                <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Theo phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discountValue">Giá trị giảm {discountType === 'percentage' ? '(%)' : '(VNĐ)'}</Label>
                <Input id="discountValue" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxDiscountAmount">Giảm tối đa (VNĐ) - Tùy chọn</Label>
                <Input id="maxDiscountAmount" type="number" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} placeholder="Bỏ trống nếu không giới hạn" disabled={discountType === 'fixed'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minOrderAmount">Giá trị đơn tối thiểu (VNĐ)</Label>
                <Input id="minOrderAmount" type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxUses">Lượt dùng tối đa</Label>
                <Input id="maxUses" type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Bỏ trống = Không giới hạn" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Hạn sử dụng</Label>
                <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Kích hoạt mã này</Label>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu mã giảm giá
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
