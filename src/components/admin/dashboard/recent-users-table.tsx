import Link from 'next/link'
import { ArrowRight, Chrome, User as UserIcon } from 'lucide-react'

import type { AdminDashboardStats } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RecentUsersTableProps {
  users: AdminDashboardStats['recentUsers']
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
  const displayUsers = users.slice(0, 20);

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm h-[370px] flex flex-col justify-between">
      <div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Người dùng mới</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0">
          {displayUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <span className="text-xs">Chưa có người dùng</span>
            </div>
          ) : (
            <ScrollArea className="h-[260px] pr-2">
              <div className="flex flex-col">
                {displayUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                      <Avatar className="size-8 shrink-0 bg-primary/10 border border-primary/20">
                        <AvatarFallback className="text-xs font-bold text-primary bg-primary/5 uppercase">
                          {user.username.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">
                          {user.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                            className={cn(
                              "text-[9px] font-semibold px-1 py-0 border-0",
                              user.role === 'admin' 
                                ? "bg-rose-500/10 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                                : "bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            )}
                          >
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                          {user.isOAuth && (
                            <Badge variant="outline" className="gap-0.5 px-1 py-0 text-[8px] bg-muted/40 border-border">
                              <Chrome className="size-2 text-primary" />
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </div>
      <CardFooter className="justify-center border-t border-border/60 py-2.5">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-semibold hover:bg-accent hover:text-accent-foreground">
          <Link href="/admin/users">
            Xem tất cả người dùng
            <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
