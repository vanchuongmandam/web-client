import Link from 'next/link';
import { Facebook , Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-headline text-xl font-semibold mb-4">Văn Chương Mạn Đàm</h3>
            <p className="text-sm text-muted-foreground">
              Một không gian dành cho những tâm hồn yêu văn chương, nơi chia sẻ tri thức và lan toả đam mê.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-lg font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary">Trang chủ</Link></li>
              <li><Link href="#" className="hover:text-primary">Về chúng tôi</Link></li>
              <li><Link href="#" className="hover:text-primary">Tài liệu</Link></li>
              <li><Link href="#" className="hover:text-primary">Chính sách</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline text-lg font-semibold mb-4">Kết nối với chúng tôi</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Để lại lời nhắn hoặc theo dõi chúng tôi trên các nền tảng xã hội.
            </p>
            <div className="flex items-center space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61577618705298" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://github.com/vanchuongmandam" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Github className="h-6 w-6" />
                <span className="sr-only">Github</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Văn Chương Mạn Đàm. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
