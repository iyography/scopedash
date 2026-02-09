import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface TikTokData {
  id?: string
  metadata: {
    last_updated: string
    profile_count: number
  }
  profiles: Record<string, {
    name: string
    nickname?: string
    avatar?: string
    signature?: string
    fans: number
    following: number
    heart: number
    video: number
    videos: Array<{
      id?: string
      desc?: string
      createTime?: number
      createTimeISO?: string
      stats: { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number }
      videoUrl?: string
      coverUrl?: string
      author: string
    }>
  }>
  all_videos: Array<{
    id?: string
    desc?: string
    createTime?: number
    createTimeISO?: string
    stats: { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number }
    videoUrl?: string
    coverUrl?: string
    author: string
  }>
}