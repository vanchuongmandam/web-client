import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-sans text-8xl font-black text-primary mb-4">404</h1>
      <h2 className="font-sans text-3xl font-bold mb-4">
        Không tìm thấy trang
      </h2>
      <p className="text-muted-foreground text-lg mb-8">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
