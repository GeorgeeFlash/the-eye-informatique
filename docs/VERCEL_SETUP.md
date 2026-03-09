# Vercel Deployment Configuration Guide

## Overview
This guide documents the Vercel configuration for **the-eye-informatique**, a Next.js application with Prisma database management.

## Files Created/Modified

### 1. `vercel.json`
Main Vercel configuration file for build, deployment, and runtime settings.

**Key Configuration:**
- **buildCommand**: `pnpm prisma:migrate && pnpm build`
  - Runs database migrations before Next.js build
  - Ensures database schema is up-to-date during deployment
- **installCommand**: `pnpm install`
  - Install dependencies using pnpm
- **framework**: `nextjs`
  - Specifies Next.js framework for optimized deployments
- **nodeVersion**: `20.x`
  - Uses Node.js 20.x runtime

**Database Configuration:**
- **DATABASE_URL** environment variable required
  - Add via Vercel Project Settings → Environment Variables
  - Format: `postgresql://user:password@host:port/database`

**Build Environment:**
- **PRISMA_SKIP_VALIDATION_WARNING**: Set to suppress non-critical warnings

**Security Headers:**
- X-Content-Type-Options: Prevents MIME type sniffing
- X-Frame-Options: Controls iframe embedding
- X-XSS-Protection: Browser XSS protection header

---

## Package.json Scripts

Added Prisma management scripts:

```json
{
  "scripts": {
    "prisma:migrate": "prisma migrate deploy",
    "prisma:seed": "prisma db seed",
    "prisma:setup": "prisma migrate deploy && prisma db seed",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Script Descriptions

- **`prisma:migrate`**: Deploy pending database migrations
  - Runs automatically during Vercel build process
  - Safe for production (only applies unapplied migrations)

- **`prisma:seed`**: Run database seed script (`prisma/seed.ts`)
  - Manual execution only (not part of build pipeline)
  - Useful for development/staging environments
  - Run locally: `pnpm prisma:seed`

- **`prisma:setup`**: Combined migration + seeding
  - For local development setup
  - Run: `pnpm prisma:setup`

- **`postinstall`**: Generates Prisma Client
  - Runs automatically after `pnpm install`
  - Ensures Prisma Client is available for type checking

---

## Deployment Workflow

### 1. **Local Development**
```bash
# Initial setup
pnpm install
pnpm prisma:setup

# Development
pnpm dev
```

### 2. **Before Deploying to Vercel**
- Ensure all migrations are committed to git
- Test migrations locally: `pnpm prisma:migrate`
- All `.ts` migration files in `prisma/migrations/` must be committed

### 3. **Vercel Deployment Process**
1. Push changes to main branch
2. Vercel triggers build:
   - Install dependencies
   - Run `pnpm prisma:migrate` (database schema updates)
   - Build Next.js application
   - Deploy to Vercel edge network

### 4. **Post-Deployment**
- Database schema is updated before app startup
- Prisma Client is regenerated if schema changed
- No manual database operations needed

---

## Environment Variables

### Required for Vercel

Set in Vercel Project Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXT_PUBLIC_*` | Client-side variables | Various app-specific configs |

### Optional Environment Variables

Refer to `.env.example` for additional variables needed by:
- Authentication (Clerk)
- Payment processing (PayUnit)
- Email service (Resend)
- AI services (Google AI, Svix)
- Storage (Vercel Blob)
- Redis cache (Upstash)

---

## Troubleshooting

### Migration Failures
- Check Vercel logs: Vercel Dashboard → Project → Deployments → Logs
- Verify DATABASE_URL is correct
- Ensure all migration files are committed to git
- Manually test: `pnpm prisma:migrate`

### Build Failures
- Review build logs for specific errors
- Check `tsconfig.json` and Next.js config
- Verify all dependencies are in `package.json`

### Database Connection Issues
- Confirm DATABASE_URL format is correct
- Verify database is accessible from Vercel's IP
- Check PostgreSQL connection limits
- Ensure SSL certificates are valid (if applicable)

---

## `.vercelignore`

Files excluded from Vercel builds to reduce deployment size:
- Node modules
- Test files
- CI/CD configuration
- Development tools

---

## Best Practices

✅ **DO:**
- Always test migrations locally before committing
- Keep migrations small and focused
- Document schema changes in commit messages
- Set up proper database backups
- Monitor deployment logs for errors
- Use staging environment before production

❌ **DON'T:**
- Manually modify database outside of migrations
- Commit sensitive data to version control
- Skip testing migrations locally
- Run multiple deployments simultaneously
- Modify migration files after they're committed

---

## Useful Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/orm/prisma-client/deployment)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/)

---

**Last Updated**: March 2026
**Project**: the-eye-informatique
