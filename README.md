# Nyama Dashboard

Administration dashboard for the **Nyama** food delivery platform — built for the Cameroonian market. Monitor restaurants, orders, deliveries, fleet, customers, and marketing campaigns from a single interface.

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Language** — TypeScript
- **Styling** — Tailwind CSS 4, shadcn/ui components
- **Charts** — Recharts
- **i18n** — French, English, Pidgin
- **Theming** — Light / Dark mode via `next-themes`

## Design System

The UI follows a warm, Africa-inspired palette:

| Token | Hex | Usage |
|---|---|---|
| Terracotta | `#a03c00` | Primary accent, CTAs |
| Leaf | `#2c694e` | Success states, secondary accent |
| Earthy | `#8b4c11` | Tertiary, badges |
| Surface | `#fbf9f5` | Background |
| On Surface | `#1b1c1a` | Text |

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Executive overview — KPIs, revenue chart, recent activity |
| `/dashboard/restaurants` | Restaurant list, status, performance |
| `/dashboard/orders` | Order management, filters, statuses |
| `/dashboard/deliveries` | Live delivery tracking |
| `/dashboard/fleet` | Fleet overview — riders, vehicles, zones |
| `/dashboard/customers` | Customer directory, segments |
| `/dashboard/marketing` | Campaigns, promotions, push notifications |
| `/dashboard/support` | Support tickets, chat, resolution metrics |
| `/dashboard/settings` | Platform settings, roles, configuration |

Additional pages: `/dashboard/users`, `/dashboard/riders`, `/dashboard/cooks`, `/dashboard/analytics`.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/your-org/nyama-dashboard.git
cd nyama-dashboard
npm install
```

### Environment Variables

```bash
cp .env.production.example .env.local
```

Edit `.env.local` and set `NEXT_PUBLIC_API_URL` to your API endpoint (defaults to `http://localhost:3000/api/v1`).

### Development

```bash
npm run dev
```

The dashboard runs on [http://localhost:3001](http://localhost:3001).

### Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add the environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://nyama-api-production.up.railway.app/api/v1`
4. Deploy — Vercel auto-detects Next.js via `vercel.json`

## License

Proprietary — all rights reserved.
