# Timesheet & Invoice App

A modern timesheet and invoice management application built with Next.js, Supabase, and ShadCN UI.

## Features

- **Time Tracking**: Log hours worked on projects with detailed descriptions
- **Client Management**: Organize client information and billing details
- **Project Management**: Track projects linked to clients with hourly rates
- **Invoice Generation**: Create professional invoices from timesheet data
- **Export Capabilities**: Export timesheets to Excel and invoices to PDF
- **Workspace Support**: Separate workspaces for different business entities
- **Template System**: Customizable invoice templates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **UI**: ShadCN UI, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Simple env-based auth (single user)
- **Export**: SheetJS (Excel), jsPDF + html2canvas (PDF)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dotkod/timesheet.git
cd timesheet
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key

# Single user auth (simple env-based)
TIMESHEET_ADMIN_USERNAME=admin@example.com
TIMESHEET_ADMIN_PASSWORD=supersecretpassword
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from the database setup
   - Configure storage buckets for assets

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (app)/             # Main application routes
│   │   ├── dashboard/     # Dashboard page
│   │   ├── workspaces/    # Workspace management
│   │   ├── projects/      # Project CRUD
│   │   ├── clients/       # Client CRUD
│   │   ├── timesheets/    # Timesheet management
│   │   ├── invoices/      # Invoice management
│   │   └── settings/      # App settings
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # ShadCN UI components
├── lib/                  # Utility functions and configurations
└── styles/               # Global styles
```

## Database Schema

The application uses the following main tables:
- `workspaces` - Business entities (Dotkod, Personal, etc.)
- `clients` - Client information
- `projects` - Projects linked to clients
- `timesheets` - Time tracking entries
- `invoices` - Invoice records
- `invoice_items` - Invoice line items
- `invoice_templates` - Customizable invoice templates

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Supabase (Backend)

1. Create production Supabase project
2. Run database migrations
3. Configure storage buckets
4. Update environment variables

## Security Notes

- Never commit `.env.local` files
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Use environment variables for all sensitive data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License

