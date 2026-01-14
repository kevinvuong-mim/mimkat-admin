# Mimkat Admin

A modern admin dashboard built with Next.js 16, React 19, and TypeScript.

## Features

- 🎨 Modern UI with Tailwind CSS and Radix UI components
- 📊 Data tables with sorting, filtering, and pagination
- 🌙 Dark mode support with theme presets
- 📱 Responsive design for mobile and desktop
- 🔐 Authentication with login/register pages
- 📈 Dashboard with CRM capabilities
- 🎯 Type-safe development with TypeScript
- 🎨 Multiple theme presets (Brutalist, Soft Pop, Tangerine)

## Tech Stack

- **Framework:** Next.js 16
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Tables:** TanStack Table
- **Forms:** React Hook Form + Zod
- **Drag & Drop:** dnd-kit
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js >= 20
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd mimkat-admin
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run generate:presets` - Generate theme presets

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (private)/         # Protected routes (dashboard, CRM)
│   └── (public)/          # Public routes (login, register)
├── components/            # Reusable components
│   ├── ui/               # UI components (buttons, inputs, etc.)
│   └── data-table/       # Data table components
├── config/               # App configuration
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── navigation/           # Navigation components
├── stores/               # State management (Zustand)
└── styles/               # Global styles and theme presets
```

## License

This project is private and proprietary.
