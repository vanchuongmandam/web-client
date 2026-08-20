"use client";
import { toErrorMessage } from "@/lib/errors";

import { useEffect, useState } from "react";
import { 
  getAdminCoupons, 
  createAdminCoupon, 
  updateAdminCoupon, 
  deleteAdminCoupon,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Coupon, PaginationMeta } from "@/lib/types";
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
import { Loader2, Plus, MoreHorizontal, Tag, Percent, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

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
      setPagination(res.pagination);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: toErrorMessage(err, "Không thể tải danh sách mã giảm giá."),
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
      code: code.trim().toUpperCase(),
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
    } catch (err) {
      toast({ title: "Lỗi", description: toErrorMessage(err), variant: "destructive" });
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
    } catch (err) {
      toast({ title: "Lỗi", description: toErrorMessage(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary animate-pulse" /> Quản lý Mã giảm giá
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng cộng: {pagination?.total ?? 0} mã giảm giá hiện có trong hệ thống.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="h-9 text-xs font-bold shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Tạo mã mới
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Mã (Code)</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Loại</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Giá trị giảm</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Lượt dùng</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Hạn dùng</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground pr-4">Thao tác</TableHead>
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
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-semibold text-sm">
                  Chưa có mã giảm giá nào.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="py-2.5 font-mono font-bold text-foreground text-xs">{coupon.code}</TableCell>
                  <TableCell className="py-2.5 text-xs font-semibold">
                    {coupon.discountType === 'percentage' ? (
                      <span className="inline-flex items-center text-blue-600">
                        <Percent className="h-3 w-3 mr-1" /> Phần trăm
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-emerald-600">
                        Giá cố định
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-foreground font-bold">
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discountValue}%` 
                      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.discountValue)
                    }
                    {coupon.maxDiscountAmount ? (
                      <div className="text-[9px] text-muted-foreground font-medium mt-0.5">
                        Tối đa: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.maxDiscountAmount)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground font-medium">
                    <span className="font-bold text-foreground">{coupon.usedCount}</span>
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ' (không hạn chế)'}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground font-medium">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {coupon.isActive ? (
                      <Badge className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border-emerald-200/40 text-emerald-700 hover:bg-emerald-500/10">
                        Đang bật
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-zinc-500/10 border-zinc-200/40 text-zinc-600 hover:bg-zinc-500/10">
                        Đã tắt
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted rounded-md border border-transparent hover:border-border/30">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hành động</DropdownMenuLabel>
                        <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => handleOpenDialog(coupon)}>
                          <Edit className="h-3 w-3 mr-2" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-xs font-semibold cursor-pointer text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(coupon._id)}
                        >
                          <Trash2 className="h-3 w-3 mr-2" /> Xóa mã
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-1">
        {pagination && (
          <PaginationControls pagination={pagination} onPageChange={setPage} isLoading={loading} unit="mã" />
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingCoupon ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cài đặt các thuộc tính giảm giá, điều kiện áp dụng và giới hạn sử dụng cho mã này.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs font-bold">Mã giảm giá (Code)</Label>
                <Input 
                  id="code" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  required 
                  placeholder="VD: KHUYENMAI20" 
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Loại giảm giá</Label>
                <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-xs" value="percentage">Theo phần trăm (%)</SelectItem>
                    <SelectItem className="text-xs" value="fixed">Số tiền cố định (VND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-xs font-bold">Giá trị giảm {discountType === 'percentage' ? '(%)' : '(VND)'}</Label>
                <Input 
                  id="discountValue" 
                  type="number" 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(e.target.value)} 
                  required 
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount" className="text-xs font-bold">Giảm tối đa (VND)</Label>
                <Input 
                  id="maxDiscountAmount" 
                  type="number" 
                  value={maxDiscountAmount} 
                  onChange={(e) => setMaxDiscountAmount(e.target.value)} 
                  placeholder="Không giới hạn" 
                  disabled={discountType === 'fixed'} 
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount" className="text-xs font-bold">Đơn tối thiểu (VND)</Label>
                <Input 
                  id="minOrderAmount" 
                  type="number" 
                  value={minOrderAmount} 
                  onChange={(e) => setMinOrderAmount(e.target.value)} 
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-xs font-bold">Tổng lượt dùng tối đa</Label>
                <Input 
                  id="maxUses" 
                  type="number" 
                  value={maxUses} 
                  onChange={(e) => setMaxUses(e.target.value)} 
                  placeholder="Không giới hạn" 
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-xs font-bold">Hạn sử dụng</Label>
                <Input 
                  id="expiresAt" 
                  type="date" 
                  value={expiresAt} 
                  onChange={(e) => setExpiresAt(e.target.value)} 
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 h-9 border rounded-lg px-3 bg-zinc-50 border-zinc-200">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-primary" />
                <Label htmlFor="isActive" className="text-xs font-semibold cursor-pointer select-none">Kích hoạt mã</Label>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs font-bold" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="h-9 text-xs font-bold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
