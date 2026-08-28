"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

const chartConfig = {
  revenue: {
    label: "Doanh thu (VNĐ)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>
  revenueMoM: number
}

export function RevenueChart({ data, revenueMoM }: RevenueChartProps) {
  const isPositive = revenueMoM >= 0

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm h-[370px] flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">
            Doanh thu 6 tháng gần đây
          </CardTitle>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] font-semibold py-0.5 px-2 rounded-md">
            Doanh thu
          </Badge>
        </CardHeader>
        <CardContent className="pb-0 pt-3">
          <ChartContainer
            config={chartConfig}
            className="h-[220px] w-full"
          >
            <BarChart data={data} accessibilityLayer margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} stroke="currentColor" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[10px] font-semibold text-muted-foreground"
              />
              <ChartTooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatVND(value as number)}
                  />
                }
              />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </div>
      <CardFooter className="pt-0 pb-3 border-t border-border/40 py-2.5 justify-center bg-muted/5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          {isPositive ? (
            <>
              <TrendingUp data-icon className="size-3.5 text-emerald-500" />
              <span>
                Tăng{" "}
                <span className="text-emerald-600 font-bold">
                  +{revenueMoM.toFixed(1)}%
                </span>{" "}
                so với tháng trước
              </span>
            </>
          ) : (
            <>
              <TrendingDown data-icon className="size-3.5 text-rose-500" />
              <span>
                Giảm{" "}
                <span className="text-rose-600 font-bold">
                  {revenueMoM.toFixed(1)}%
                </span>{" "}
                so với tháng trước
              </span>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
