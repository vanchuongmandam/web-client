import { CartesianGrid, Area, AreaChart, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface ActivityChartProps {
  data: Array<{ month: string; orders: number; purchases: number }>
}

const chartConfig = {
  orders: {
    label: 'Đơn hàng',
    color: 'hsl(var(--primary))',
  },
  purchases: {
    label: 'Lượt mua',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm h-[370px] flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">Xu hướng hoạt động</CardTitle>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] font-semibold py-0.5 px-2 rounded-md">Activity</Badge>
        </CardHeader>
        <CardContent className="pb-0 pt-3">
          <ChartContainer
            config={chartConfig}
            className="h-[210px] w-full"
          >
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
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
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[10px] font-semibold text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#ordersGradient)"
              />
              <Area
                type="monotone"
                dataKey="purchases"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#purchasesGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </div>
      <CardFooter className="pt-0 pb-3 border-t border-border/40 py-2.5 justify-center bg-muted/5">
        <p className="text-[10px] text-muted-foreground font-semibold">
          Số lượng đơn hàng được tạo và lượt tải tài liệu thực tế theo từng tháng.
        </p>
      </CardFooter>
    </Card>
  )
}
