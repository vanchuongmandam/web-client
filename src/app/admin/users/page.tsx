"use client";

import { useEffect, useState } from "react";
import { 
  getAdminUsers, 
  updateAdminUserRole, 
  updateAdminUserStatus, 
  adjustAdminUserBalance 
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AdminUser, PaginatedResponse } from "@/lib/types";
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

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

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
      setTotalPages(res.pagination.totalPages);
      setTotalUsers(res.pagination.total);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tải danh sách người dùng.",
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
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    if (!token) return;
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateAdminUserRole(user._id, newRole, token);
      setUsers(users.map(u => u._id === user._id ? { ...u, role: newRole } : u));
      toast({ title: "Thành công", description: `Đã đổi quyền thành ${newRole}.` });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
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
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Quản lý Người dùng
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng cộng: {totalUsers} người dùng
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input 
            placeholder="Tìm theo username hoặc email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-background"
          />
          <Button type="submit" variant="secondary"><Search className="h-4 w-4" /></Button>
        </form>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Liên kết</TableHead>
              <TableHead>Số dư ví</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
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
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    {user.isOAuth ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Email/Pass
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.balance || 0)}
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full font-bold">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                        User
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" /> Bị khóa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenBalanceDialog(user)}>
                          Cộng/Trừ số dư ví
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleRole(user)}>
                          {user.role === 'admin' ? "Hạ quyền thành User" : "Cấp quyền Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user)}
                          className={user.isActive ? "text-red-600" : "text-green-600"}
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

      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Điều chỉnh số dư ví</DialogTitle>
            <DialogDescription>
              Cộng hoặc trừ tiền trong ví của người dùng <span className="font-bold">{selectedUser?.username}</span>.
              (Nhập số âm để trừ tiền).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Số tiền (VNĐ)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="VD: 50000 hoặc -20000"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Lý do</Label>
              <Input
                id="reason"
                placeholder="VD: Hoàn tiền, thưởng lỗi..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleAdjustBalance} disabled={isAdjusting || !adjustAmount}>
              {isAdjusting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
