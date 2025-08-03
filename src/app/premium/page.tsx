import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';

const premiumFeatures = [
  "Truy cập sớm các bài viết và tiểu luận mới.",
  "Tải xuống không giới hạn từ thư viện số của chúng tôi.",
  "Truy cập vào nội dung độc quyền chỉ dành cho thành viên premium.",
  "Trải nghiệm đọc không có quảng cáo.",
  "Hỗ trợ phân tích văn học độc lập.",
];

export default function PremiumPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">
            Nâng cấp Premium
          </h1>
          <p className="mt-4 text-xl text-foreground/80">
            Mở khóa trải nghiệm đầy đủ của Văn Chương Mạn Đàm và hỗ trợ sứ mệnh của chúng tôi để giữ cho khám phá văn học tồn tại.
          </p>
          <ul className="mt-8 space-y-4">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="rounded-full bg-secondary p-1 mr-4">
                  <Check className="h-4 w-4 text-secondary-foreground" />
                </div>
                <span className="flex-1 text-lg">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <Card className="bg-gradient-to-br from-card to-background">
          <CardHeader className="text-center">
            <Star className="mx-auto h-12 w-12 text-accent" />
            <CardTitle className="font-headline text-3xl mt-4">Trở thành thành viên</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-4xl font-bold font-headline">99.000đ<span className="text-xl font-body text-muted-foreground">/tháng</span></p>
            <p className="text-muted-foreground">Thanh toán hàng năm, hoặc 129.000đ hàng tháng.</p>
            <Link href="/signup" className="w-full block">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Đăng ký ngay
              </Button>
            </Link>
             <p className="text-sm text-muted-foreground">Đã là thành viên? <Link href="/login" className="underline text-primary">Đăng nhập</Link>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
