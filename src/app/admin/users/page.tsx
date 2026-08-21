"use client";
import { toErrorMessage } from "@/lib/errors";

import { useEffect, useState } from "react";
import { 
  getAdminUsers, 
  updateAdminUserRole, 
  updateAdminUserStatus, 
  adjustAdminUserBalance 
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { AdminUser, PaginationMeta } from "@/lib/types";
import { cn } from "@/lib/utils";
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
import { Loader2, Search, MoreHorizontal, Shield, ShieldOff, Plus, Minus, CheckCircle2, XCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Balance Dialog State
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAdminUsers({ page, limit: 10, search }, token);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: toErrorMessage(err, "Không thể tải danh sách người dùng."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, token, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (!token) return;
    try {
      await updateAdminUserStatus(user._id, !user.isActive, token);
      setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast({ title: "Thành công", description: `Đã ${user.isActive ? 'khóa' : 'mở khóa'} tài khoản.` });
    } catch (err) {
      toast({ title: "Lỗi", description: toErrorMessage(err), variant: "destructive" });
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    if (!token) return;
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateAdminUserRole(user._id, newRole, token);
      setUsers(users.map(u => u._id === user._id ? { ...u, role: newRole } : u));
      toast({ title: "Thành công", description: `Đã đổi quyền thành ${newRole}.` });
    } catch (err) {
      toast({ title: "Lỗi", description: toErrorMessage(err), variant: "destructive" });
    }
  };

  const handleOpenBalanceDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setAdjustAmount("");
    setAdjustReason("");
    setBalanceDialogOpen(true);
  };

  const handleAdjustBalance = async () => {
    if (!token || !selectedUser) return;
    const amount = Number(adjustAmount);
    if (!amount || isNaN(amount)) {
      toast({ title: "Lỗi", description: "Số tiền không hợp lệ.", variant: "destructive" });
      return;
    }
    
    setIsAdjusting(true);
    try {
      const res = await adjustAdminUserBalance(selectedUser._id, amount, adjustReason || "Điều chỉnh từ Admin", token);
      setUsers(users.map(u => u._id === selectedUser._id ? { ...u, balance: res.user.balance } : u));
      setBalanceDialogOpen(false);
      toast({ title: "Thành công", description: "Đã cập nhật số dư." });
    } catch (err) {
      toast({ title: "Lỗi", description: toErrorMessage(err), variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Quản lý Người dùng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng cộng: {pagination?.total ?? 0} người dùng đăng ký hệ thống.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo username hoặc email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-zinc-200 bg-white text-foreground w-full"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9"><Search className="h-4 w-4" /></Button>
        </form>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Người dùng</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Liên kết</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Số dư ví</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Vai trò</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground pr-4">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-semibold text-sm">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="py-2.5">
                    <div className="font-bold text-foreground text-xs">{user.username}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{user.email}</div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    {user.isOAuth ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md">
                        Email/Pass
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 font-mono font-bold text-xs tabular-nums">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.balance || 0)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        User
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                        <XCircle className="h-3 w-3" /> Bị khóa
                      </span>
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
                        <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => handleOpenBalanceDialog(user)}>
                          Cộng/Trừ số dư ví
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => handleToggleRole(user)}>
                          {user.role === 'admin' ? "Hạ quyền thành User" : "Cấp quyền Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user)}
                          className={cn("text-xs font-semibold cursor-pointer", user.isActive ? "text-rose-600 hover:text-rose-700" : "text-emerald-600 hover:text-emerald-700")}
                        >
                          {user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
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
          <PaginationControls pagination={pagination} onPageChange={setPage} isLoading={loading} unit="người dùng" />
        )}
      </div>

      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Điều chỉnh số dư ví</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cộng hoặc trừ tiền trong ví của người dùng <span className="font-bold text-foreground">{selectedUser?.username}</span>.
              (Nhập số âm để trừ tiền).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-xs font-bold">Số tiền (VNĐ)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="VD: 50000 hoặc -20000"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-xs font-bold">Lý do</Label>
              <Input
                id="reason"
                placeholder="VD: Hoàn tiền, thưởng lỗi..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold" onClick={() => setBalanceDialogOpen(false)}>Hủy</Button>
            <Button size="sm" className="h-9 text-xs font-bold" onClick={handleAdjustBalance} disabled={isAdjusting || !adjustAmount}>
              {isAdjusting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
