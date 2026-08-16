"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-sans text-5xl font-bold text-primary mb-4">
        Đã xảy ra lỗi
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        Rất tiếc, đã có sự cố xảy ra. Vui lòng thử lại.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
