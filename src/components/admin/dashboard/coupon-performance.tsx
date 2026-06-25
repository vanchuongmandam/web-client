import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { CouponStat } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CouponPerformanceProps {
  coupons: CouponStat[]
}

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    value
  )

function getStatusBadge(coupon: CouponStat) {
  if (!coupon.isActive) {
    return <Badge variant="outline" className="text-zinc-500 border-zinc-200 bg-zinc-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">Ngừng</Badge>
  }
  if (new Date(coupon.expiresAt) < new Date()) {
    return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">Hết hạn</Badge>
  }
  return <Badge variant="outline" className="text-green-700 border-green-200 bg-green-500/5 px-2 py-0.5 rounded-full text-[10px] font-semibold">Hoạt động</Badge>
}

export function CouponPerformance({ coupons }: CouponPerformanceProps) {
  const displayCoupons = coupons.slice(0, 5);

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm h-[370px] flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">Hiệu suất mã giảm giá</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-0">
          {displayCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <span className="text-xs">Chưa có mã giảm giá nào được sử dụng</span>
            </div>
          ) : (
            <div className="flex flex-col pt-1.5">
              {displayCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors px-2 rounded-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className="font-mono text-xs font-bold uppercase border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-md">
                      {coupon.code}
                    </Badge>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {coupon.discountType === 'percentage'
                          ? `Giảm ${coupon.discountValue}%`
                          : `Giảm ${formatVND(coupon.discountValue)}`}
                      </span>
                      <span className="text-[9px] text-muted-foreground/80 mt-0.5">
                        Đã dùng: {coupon.usedCount} / {coupon.maxUses !== null ? coupon.maxUses : '∞'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {formatVND(coupon.totalDiscount)}
                      </span>
                      <div className="scale-90 origin-right mt-1">
                        {getStatusBadge(coupon)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="justify-center border-t border-border/40 py-2">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground">
          <Link href="/admin/coupons" className="flex items-center">
            Quản lý mã giảm giá
            <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
