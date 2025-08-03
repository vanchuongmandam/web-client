import type { SVGProps } from "react";

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.52.02C13.84 0 15.14.01 16.44 0a5 5 0 0 1 4.23 4.4a5 5 0 0 1-1.46 5.63a5 5 0 0 1-4.8 1.45V16a5 5 0 1 1-10 0V4.69a5 5 0 1 1 8.11-3.27V16a10 10 0 1 0 10 10V10.2a1 1 0 0 0-1-1H16.4a1 1 0 0 0-1 1v10.33a8 8 0 1 1-8.33-8.33V4.69a1 1 0 0 0-1-1H3.34a1 1 0 0 0-1 1v1.34a8 8 0 0 0 8.12 8.11V.02z" />
    </svg>
  );
}
