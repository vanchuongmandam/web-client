"use client"

import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

const statusLabels: Record<string, string> = {
  pending: "Chờ TT",
  paid: "Đã TT",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Hoàn tiền",
}

const statusColors: Record<string, string> = {
  pending: "hsl(var(--chart-4))",
  paid: "hsl(var(--chart-2))",
  confirmed: "hsl(var(--primary))",
  cancelled: "hsl(var(--destructive))",
  expired: "hsl(var(--muted))",
  refunded: "hsl(var(--chart-1))",
}

const chartConfig: ChartConfig = Object.fromEntries(
  Object.entries(statusLabels).map(([key, label]) => [
    key,
    { label, color: statusColors[key] },
  ])
)

const paymentMethodLabels: Record<string, string> = {
  sepay: "SePay",
  wallet: "Ví",
}

interface OrderStatusChartProps {
  breakdown: Record<string, number>
  paymentMethod: Record<string, { revenue: number; count: number }>
}

export function OrderStatusChart({
  breakdown,
  paymentMethod,
}: OrderStatusChartProps) {
  const pieData = useMemo(
    () =>
      Object.entries(breakdown)
        .map(([status, count]) => ({
          name: status,
          label: statusLabels[status] ?? status,
          value: count,
          fill: statusColors[status] ?? "hsl(var(--muted))",
        }))
        .filter((d) => d.value > 0),
    [breakdown]
  );

  const totalOrders = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  );

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm h-[370px] flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">
            Phân bổ đơn hàng
          </CardTitle>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] font-semibold py-0.5 px-2 rounded-md">
            Trạng thái
          </Badge>
        </CardHeader>
        <CardContent className="pb-0 pt-3 flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="w-full h-[165px] max-w-[165px] aspect-square"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    formatter={(value, name) => {
                      const label =
                        statusLabels[name as string] ?? (name as string);
                      return `${label}: ${value} đơn`;
                    }}
                  />
                }
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={66}
                paddingAngle={2}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <text
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 4}
                            className="fill-foreground text-xl font-extrabold tracking-tight"
                          >
                            {totalOrders.toLocaleString("vi-VN")}
                          </text>
                          <text
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                            className="fill-muted-foreground text-[9px] font-bold uppercase tracking-wider"
                          >
                            Tổng đơn
                          </text>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </div>

      <CardFooter className="flex-col gap-2.5 pt-0 pb-3 border-t border-border/40 py-2 bg-muted/5">
        {pieData.length > 0 && (
          <div className="flex w-full items-center justify-center gap-x-2.5 gap-y-1 flex-wrap">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: d.fill }}
                />
                <span>{d.label}</span>
                <span className="font-bold text-foreground tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {Object.keys(paymentMethod).length > 0 && (
          <div className="flex w-full items-center justify-center gap-3 border-t border-border/20 pt-2 mt-0.5">
            {Object.entries(paymentMethod).map(([method, stats]) => (
              <div key={method} className="flex items-center gap-1.5 font-semibold">
                <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-border/60 bg-white dark:bg-zinc-950">
                  {paymentMethodLabels[method] ?? method}
                </Badge>
                <span className="text-[10px] tabular-nums text-foreground">
                  {formatVND(stats.revenue)}
                </span>
                <span className="text-[9px] text-muted-foreground font-medium">
                  ({stats.count} đơn)
                </span>
              </div>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
