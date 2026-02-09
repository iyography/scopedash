# Database Migration Setup

## Problem Fixed
The original ScopeDash used file-based storage (`public/data.json`) which doesn't work in production environments like Vercel where the filesystem is read-only. This caused data to revert to old values after deployments.

## Solution
Migrated to Supabase database for persistent storage with file fallback for backward compatibility.

## Setup Steps

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Run Database Migration
Copy the contents of `supabase_migration.sql` and run it in the Supabase SQL Editor:

```sql
-- Creates tiktok_data table for current data
-- Creates tiktok_data_backups table for historical backups
-- Enables public access (customize policies as needed)
```

### 3. Configure Environment Variables
Update your environment variables:

**For Development (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**For Production (Vercel Environment Variables):**
- Add the same variables in your Vercel dashboard

### 4. How It Works

#### Data Loading Priority:
1. **Primary**: Load from Supabase database
2. **Fallback**: Load from `public/data.json` (for backward compatibility)
3. **Error**: Show "No data available" message

#### Data Saving:
1. **Primary**: Save to Supabase database with automatic backups
2. **Secondary**: Also save to file (if filesystem is writable) for local development

#### Benefits:
- ✅ **Production Persistence**: Data survives deployments
- ✅ **Automatic Backups**: Keeps last 5 versions in database
- ✅ **Backward Compatibility**: Still works with file-based approach locally
- ✅ **Real-time Updates**: Database changes reflect immediately
- ✅ **Channel Persistence**: New channels like "arena.fever" stay after refresh

## File Changes Made

1. **lib/supabase.ts**: Supabase client and TypeScript interfaces
2. **src/app/api/data/route.ts**: New endpoint for loading data (database → file → error)
3. **src/app/api/refresh/route.ts**: Updated to save to both database and file
4. **src/app/page.tsx**: Updated to use new `/api/data` endpoint instead of `/data.json`
5. **.env.local**: Added Supabase environment variables

## Migration Impact

- **Existing data**: Will be automatically migrated on first refresh
- **Local development**: Still works with file-based approach as fallback
- **Production**: Now uses persistent database storage
- **User experience**: Channels and follower counts now persist across refreshes

## Troubleshooting

If you see "No data available":
1. Check environment variables are set correctly
2. Verify database migration ran successfully
3. Check Supabase project is active
4. Run a data refresh to populate the database

The system will automatically fall back to file-based storage if database is unavailable.