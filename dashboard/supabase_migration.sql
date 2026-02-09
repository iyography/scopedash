-- Create TikTok data table for storing current data
CREATE TABLE IF NOT EXISTS tiktok_data (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create TikTok data backups table for storing historical data  
CREATE TABLE IF NOT EXISTS tiktok_data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tiktok_data_updated_at ON tiktok_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_tiktok_data_backups_created_at ON tiktok_data_backups(created_at);

-- Enable Row Level Security
ALTER TABLE tiktok_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_data_backups ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (you may want to restrict this in production)
CREATE POLICY "Allow all access to tiktok_data" ON tiktok_data FOR ALL USING (true);
CREATE POLICY "Allow all access to tiktok_data_backups" ON tiktok_data_backups FOR ALL USING (true);