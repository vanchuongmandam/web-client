import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, BookLock } from "lucide-react";

const libraryBooks = [
  {
    title: "Moby Dick",
    author: "Herman Melville",
    image: "https://placehold.co/400x600.png",
    dataAiHint: "whale sea",
    premium: false,
  },
  {
    title: "Chiến tranh và Hòa bình",
    author: "Leo Tolstoy",
    image: "https://placehold.co/400x600.png",
    dataAiHint: "battlefield snow",
    premium: true,
  },
  {
    title: "The Odyssey",
    author: "Homer",
    image: "https://placehold.co/400x600.png",
    dataAiHint: "greek ship",
    premium: false,
  },
  {
    title: "Kiêu hãnh và Định kiến",
    author: "Jane Austen",
    image: "https://placehold.co/400x600.png",
    dataAiHint: "regency couple",
    premium: false,
  },
    {
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    image: "https://placehold.co/400x600.png",
    dataAiHint: "knight windmill",
    premium: true,
  },
  {
    title: "Ulysses",
    author: "James Joyce",
    image: "https://placehold.co/400x600.png",
    dataAiHint: "dublin street",
    premium: true,
  }
];

export default function LibraryPage() {
  return (
    <div className="container py-12 md:py-20">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Thư viện số</h1>
                <p className="mt-3 text-lg text-foreground/70">
                    Một bộ sưu tập các tác phẩm văn học kỹ thuật số.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Tải lên tác phẩm</Button>
                </Link>
                <p className="self-center text-sm text-muted-foreground hidden md:block">Yêu cầu đăng nhập</p>
            </div>
        </div>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {libraryBooks.map((book) => (
          <Card key={book.title} className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-xl">
            {book.premium && (
                <div className="absolute top-2 right-2 z-10 rounded-full bg-accent p-2 text-accent-foreground">
                    <BookLock className="h-4 w-4" />
                    <span className="sr-only">Nội dung Premium</span>
                </div>
            )}
            <CardHeader className="p-0">
                <Image
                    src={book.image}
                    data-ai-hint={book.dataAiHint}
                    alt={`Bìa sách ${book.title}`}
                    width={400}
                    height={600}
                    className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105"
                />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-base font-headline leading-tight">{book.title}</CardTitle>
              <CardDescription className="mt-1 text-sm">{book.author}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Link href="/login" className="w-full">
                <Button variant={book.premium ? "secondary" : "default"} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Tải xuống
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12 text-muted-foreground">
        <p>Việc tải lên và tải xuống sách yêu cầu tài khoản.</p>
        <p>Sách premium chỉ dành cho <Link href="/premium" className="underline text-primary">thành viên premium</Link>.</p>
      </div>
    </div>
  );
}
