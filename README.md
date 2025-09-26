# Movie Tracker

A modern movie tracking application built with Next.js 15, TypeScript, and Tailwind CSS. Search for movies, track your watchlist, and manage your movie collection.

## Features

- 🔍 **Movie Search**: Search movies using The Movie Database (TMDB) API
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 🗄️ **Database Integration**: PostgreSQL with Drizzle ORM
- 🔐 **Authentication**: NextAuth.js integration ready
- 📊 **State Management**: Zustand for client-side state
- 🧪 **Testing**: Jest and Playwright for comprehensive testing
- 🚀 **Performance**: Optimized with Next.js 15 and Turbopack

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Testing**: Jest, Playwright, Testing Library
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database
- TMDB API key (get one at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/lassestilvang/stream4.git
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/moviedb"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   TMDB_API_KEY="your-tmdb-api-key-here"
   ```

4. **Database Setup**

   ```bash
   # Generate and run migrations
   pnpm drizzle:generate
   pnpm drizzle:migrate
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm test:e2e` - Run Playwright e2e tests
- `pnpm test:e2e:ui` - Run Playwright tests with UI

## Project Structure

```
/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   └── tmdb/       # TMDB integration
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── SearchBar.tsx  # Movie search component
│   └── lib/               # Utility libraries
│       ├── db.ts          # Database connection
│       ├── schema.ts      # Database schema
│       └── utils.ts       # Utility functions
├── tests/                 # E2E tests
├── drizzle.config.ts      # Drizzle configuration
├── components.json        # shadcn/ui configuration
├── jest.config.js         # Jest configuration
├── playwright.config.ts   # Playwright configuration
└── tailwind.config.js     # Tailwind configuration
```

## Database Schema

The application uses the following main entities:

- **Users**: Authentication and user profiles
- **Movies**: Movie information and user collections
- **Watch History**: Track what users have watched

## API Routes

- `GET /api/tmdb/search?q=<query>` - Search movies via TMDB

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

### Test with UI

```bash
pnpm test:e2e:ui
```

## Deployment

The app is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [The Movie Database API](https://developers.themoviedb.org/3)

## License

This project is licensed under the MIT License.
