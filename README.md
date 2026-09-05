# Văn Chương Mạn Đàm — Web Client

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/UI-Shadcn%20%2F%20Radix-161616)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-MIT-amber)](#license)

The official web frontend for **Văn Chương Mạn Đàm (VCMD)** — a modern, elegant literary publishing platform, digital library, and document marketplace. Designed with an editorial paper aesthetic and built using **Next.js 15 (App Router)**, **TypeScript**, and **TailwindCSS**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Design System & Aesthetics](#design-system--aesthetics)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Scripts](#scripts)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)

---

## Overview

**Văn Chương Mạn Đàm** is a community-driven digital sanctuary for Vietnamese literature, educational essays, analysis, and literary study materials. The web client delivers an immersive, distraction-free reading experience, an interactive document marketplace with automated banking QR payments (SePay), and a comprehensive administration dashboard for content editors.

---

## Key Features

### Editorial & Reading Experience
- **Literary Articles & Essays:** Clean, distraction-free reading mode optimized for long-form literature.
- **Categorized Sections:** Curated categories including *Dành cho chuyên Văn*, *Học và Thi*, *Văn chương thú vị*, *Góc sáng tác*, and *Thư viện*.
- **Interactive PDF Reader:** In-browser custom document reader powered by `react-pdf` and `pdfjs-dist` featuring:
  - Multi-theme reading canvas: *Classic Paper*, *Warm Ivory*, *Sepia*, *Dark Obsidian*, *Night Contrast*.
  - Smooth zoom controls, page thumbnails, and two-page or single-page view modes.
  - Fullscreen and distraction-free presentation.
- **Quote Card Generator:** Users can highlight impactful quotes from articles and generate downloadable, stylized social media quote cards via `html2canvas`.
- **Engagement Tools:** Threaded comments, user bookmarking, and article access request workflows for exclusive study material.

### Document Marketplace & Digital Commerce
- **Digital Document Catalog:** Curated educational documents, exam preparation materials, and literary analysis books with sample page previews.
- **Direct Contact & Zalo Integration:** Direct contact modals for inquiry-based distribution featuring responsive Zalo QR scanning and 1-tap deep links.
- **Automated Bank Transfer (SePay VietQR):** Real-time automated checkout with instant dynamic VietQR code generation, transfer syntax matching, and webhook status reconciliation.
- **User Wallet System:** Digital credit balance for instant purchases, top-up history, and downloadable invoices.
- **Promotions & Coupons:** Percentage-based and fixed-discount vouchers applied automatically at checkout.

### Editorial CMS & Authoring
- **Rich-Text Editor:** Tiptap WYSIWYG editor supporting typography styles, formatting bubbles, highlights, text alignment, and embedded media.
- **Document Management:** Upload covers, sample PDF excerpts, private document assets, price configuration, and collection bundling.

### Administration Dashboard
- **Analytics & Reporting:** Revenue charts, top-selling documents, recent user registrations, and order fulfillment statistics via `Recharts`.
- **Content Governance:** Manage categories, hierarchical collections, article permissions, comments moderation, and access requests.
- **System Settings:** Centralized management of contact channels, banking details, and default notification templates.

---

## Design System & Aesthetics

The UI adheres strictly to the **VCMD Master Frontend Design System**:

- **Strict Sans-Serif Typography:** Single font family `Poppins` (`font-sans`) across all headings, body text, and interfaces.
- **Warm Paper Canvas:** Natural tones inspired by classic literary journals:
  - `bg-warm-cream` (`#F7F3EA` / `#FDFBF7`) — Main reading canvas.
  - `bg-warm-ivory` / `bg-card` (`#FFFDF8`) — Elevated surfaces and cards.
  - `border-sand` (`#E5DFD5`) & `border-sand-light` (`#EFEBE3`) — Subtle parchment borders.
- **Primary Brand Accents:**
  - `text-primary` / `bg-primary` (`#8F3045` / `#A34355`) — Deep Court Wine Red (*Đỏ Rượu Cung Đình*).
  - `text-accent` / `bg-accent` (`#B88A3B` / `#C5A059`) — Antique Gold (*Vàng Đồng Cổ*).
  - `text-earth` (`#302A28` / `#3D3534`) — Earth Ink (*Mực Nâu Trầm*).
- **Subtle Elevation:** Eliminates aggressive shadows (`shadow-lg`, `shadow-2xl`) in favor of refined `border-2 border-sand` outlines and `shadow-xs` / `shadow-sm`.
- **Nested Radius Hierarchy:** Enforces $R_{inner} \le R_{outer}$:
  - Modals & Primary Containers: `rounded-xl` (12px).
  - Buttons, Inputs, Cards: `rounded-md` (6px) or `rounded-lg` (8px).
  - Mini Badges, Tags, Checkboxes: `rounded-sm` (4px).
  - Avatars & Pills: `rounded-full`.

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | React server components, hybrid rendering, image optimization |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type-safe development across the codebase |
| **Styling** | [TailwindCSS 3.4](https://tailwindcss.com/) | Utility-first styling with custom semantic design tokens |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/) | Accessible, unstyled UI primitives (Dialogs, Dropdowns, Tabs, etc.) |
| **State Management**| [Zustand 5](https://zustand-demo.pmnd.rs/) | Lightweight global stores (Reader state, cart, modals) |
| **Authentication** | [NextAuth.js v5 Beta](https://authjs.dev/) | Session handling, Google OAuth, and JWT integration |
| **PDF Viewing** | [React-PDF](https://projects.wojtekmaj.pl/react-pdf/) + `pdfjs-dist` | In-browser high-performance PDF rendering and theme manipulation |
| **Rich Text Editor**| [Tiptap](https://tiptap.dev/) | Headless, extensible rich-text authoring suite |
| **Forms & Schema** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form state orchestration and validation |
| **Visualizations** | [Recharts](https://recharts.org/) | Responsive analytics charts for the admin dashboard |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent vector icons |

---

## Project Architecture

```text
web-client/
├── public/                 # Static assets, logos, and fallback images
├── src/
│   ├── app/                # Next.js App Router directory
│   │   ├── (auth)/         # Authentication routes (login, register, reset)
│   │   ├── admin/          # Admin management suite (dashboard, orders, docs)
│   │   ├── articles/       # Article reading, detail, and authoring views
│   │   ├── documents/      # Document marketplace, detail, checkout flows
│   │   ├── profile/        # User account, wallet, purchases, and bookmarks
│   │   ├── layout.tsx      # Root layout with providers & global navigation
│   │   └── page.tsx        # Homepage with featured articles & banners
│   ├── components/         # Reusable React components
│   │   ├── admin/          # Admin-specific tables, sidebar, and forms
│   │   ├── articles/       # Article cards, comments, reading suggestions
│   │   ├── documents/      # Document cards, Zalo modal, preview dialogs
│   │   ├── pdf-viewer/     # Interactive PDF reader client & toolbars
│   │   ├── ui/             # Shadcn / Radix component primitives
│   │   ├── footer.tsx      # Global footer
│   │   └── header.tsx      # Responsive navigation header
│   ├── hooks/              # Custom React hooks (toast, mobile, debouncing)
│   ├── lib/                # Shared utilities, API clients, and constants
│   │   ├── api/            # Modular backend API communication layer
│   │   ├── types.ts        # Global TypeScript interfaces and schemas
│   │   └── utils.ts        # Tailwind merge, formatting, and media helpers
│   ├── stores/             # Zustand stores (reader settings, auth state)
│   └── styles/             # Global CSS and Tailwind directives
├── tailwind.config.ts      # Semantic design system color tokens & spacing
├── tsconfig.json           # TypeScript compilation configuration
└── package.json            # Node.js dependencies and scripts
```

---

## Getting Started

### Prerequisites

- **Node.js:** `v20.x` or higher
- **Package Manager:** `pnpm` (recommended) or `npm` / `yarn`
- **Backend Service:** An instance of [VCMD API Server](../api-server/) running locally or remotely

### Environment Variables

Create a `.env.local` file in the root of `web-client/` based on `.env.example`:

```bash
cp .env.example .env.local
```

Configure the following variables:

```ini
# Public URL of the backend API (client-side calls)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth / Auth.js Configuration
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_32_character_random_secret_here

# Google OAuth Credentials (Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Deployment settings
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000
```

### Installation

Install dependencies using `pnpm`:

```bash
pnpm install
```

### Running the App

Start the development server with Turbopack:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `pnpm dev` | Starts development server with Turbopack (`--turbopack`) |
| `build` | `pnpm build` | Compiles optimized production bundle |
| `start` | `pnpm start` | Launches Next.js production server |
| `lint` | `pnpm lint` | Runs ESLint analysis |
| `typecheck` | `pnpm typecheck` | Validates TypeScript types across the project (`tsc --noEmit`) |

---

## Docker Deployment

You can build and containerize the Next.js frontend using the included multi-stage `Dockerfile`:

```bash
# Build the Docker image
docker build -t vcmd-web-client:latest .

# Run the container
docker run -p 3000:3000 --env-file .env.local vcmd-web-client:latest
```

Alternatively, launch the complete stack with Docker Compose from the root workspace:

```bash
docker compose up -d web-client
```

---

## License

This project is licensed under the [MIT License](LICENSE).
