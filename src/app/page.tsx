import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const featuredContent = [
  {
    type: "Bài viết",
    title: "Tính biểu tượng của ánh sáng xanh trong The Great Gatsby",
    description: "Một phân tích chuyên sâu về một trong những biểu tượng nổi tiếng nhất của văn học.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "books library",
    link: "/articles/the-great-gatsby-symbolism",
  },
  {
    type: "Thơ",
    title: "Ozymandias của Percy Bysshe Shelley",
    description: "Một bài sonnet vượt thời gian về bản chất phù du của quyền lực.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "desert ruins",
    link: "/library",
  },
  {
    type: "Văn xuôi",
    title: "Một đề nghị khiêm tốn của Jonathan Swift",
    description: "Giải mã nghệ thuật châm biếm trong tác phẩm gây tranh cãi nhất của Swift.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "vintage paper",
    link: "/articles/a-modest-proposal-satire",
  },
];

export default function Home() {
  return (
    <div>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Khai sáng tâm trí
                </h1>
                <p className="max-w-[600px] text-foreground/80 md:text-xl font-body">
                  Chào mừng đến với Văn Chương Mạn Đàm, một thánh địa cho những độc giả ham học hỏi. Khám phá các bài viết, thơ ca và văn xuôi vượt thời gian. Khám phá những góc nhìn mới.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/articles">
                  <Button size="lg" className="w-full min-[400px]:w-auto">Khám phá bài viết</Button>
                </Link>
                <Link href="/library">
                  <Button size="lg" variant="secondary" className="w-full min-[400px]:w-auto">Ghé thăm thư viện</Button>
                </Link>
              </div>
            </div>
            <Image
              src="https://placehold.co/600x400.png"
              data-ai-hint="lantern library"
              width="600"
              height="400"
              alt="Hero"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-background/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Tác phẩm nổi bật</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                Cùng đắm mình vào những tuyển tập phân tích văn học và các tác phẩm kinh điển được chúng tôi tuyển chọn.
              </p>
            </div>
          </div>
          <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
            {featuredContent.map((item) => (
              <Card key={item.title} className="flex flex-col overflow-hidden transition-transform transform hover:-translate-y-2 hover:shadow-xl">
                <CardHeader className="p-0">
                  <Image
                    src={item.image}
                    data-ai-hint={item.dataAiHint}
                    alt={item.title}
                    width={600}
                    height={400}
                    className="aspect-video object-cover"
                  />
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <div className="text-xs uppercase font-semibold text-secondary-foreground tracking-wider">{item.type}</div>
                  <CardTitle className="mt-2 font-headline">{item.title}</CardTitle>
                  <CardDescription className="mt-2 font-body">{item.description}</CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Link href={item.link} className="w-full">
                    <Button variant="outline" className="w-full">
                      Đọc thêm <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Mở khóa quyền truy cập Premium</h2>
            <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
              Nhận quyền truy cập sớm vào các bài viết mới, các bản tải xuống độc quyền từ thư viện số của chúng tôi và hỗ trợ công việc của chúng tôi.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
            <Link href="/premium">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Trở thành thành viên
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
