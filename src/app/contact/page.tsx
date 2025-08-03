import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Liên hệ</h1>
        <p className="mt-3 text-lg text-foreground/70">
          Có câu hỏi, phản hồi, hoặc một gợi ý? Chúng tôi rất muốn nghe từ bạn.
        </p>
      </header>
      <div className="max-w-2xl mx-auto">
        <ContactForm />
      </div>
    </div>
  );
}
