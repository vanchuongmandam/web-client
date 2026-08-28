import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SkeletonCard({
  className,
  headerLines = 1,
  contentLines = 3,
}: {
  className?: string;
  headerLines?: number;
  contentLines?: number;
}) {
  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col gap-2">
          {Array.from({ length: headerLines }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-2/3" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-2">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={i === 0 ? "h-5 w-full" : "h-3 w-1/2"}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: 6 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[100px]">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: 2 chart areas (3 + 2 split) */}
      <div className="grid lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-3 h-[320px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Skeleton className="h-[230px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 h-[320px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Skeleton className="h-[230px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: 3 table areas */}
      <div className="grid lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-[350px]">
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 4: 2 areas (3 + 2 split) */}
      <div className="grid lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-3 h-[320px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-52" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Skeleton className="h-[230px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 h-[320px]">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Skeleton className="h-[230px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
