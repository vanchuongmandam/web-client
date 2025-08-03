export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 bg-background/95">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Văn Chương Mạn Đàm. Đã đăng ký bản quyền.
        </p>
      </div>
    </footer>
  );
}
