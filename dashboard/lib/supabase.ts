// Simple persistent storage utility using localStorage and API endpoint
class PersistentStorage {
  private static instance: PersistentStorage;
  
  public static getInstance(): PersistentStorage {
    if (!PersistentStorage.instance) {
      PersistentStorage.instance = new PersistentStorage();
    }
    return PersistentStorage.instance;
  }

  async saveChannels(channels: string[]): Promise<void> {
    // Save to localStorage immediately if in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('scopedash_channels', JSON.stringify(channels));
        localStorage.setItem('scopedash_channels_timestamp', new Date().toISOString());
        console.log('Channels saved to localStorage');
      } catch (error) {
        console.warn('Failed to save channels to localStorage:', error);
      }
    }

    // Save to API endpoint for server persistence
    try {
      // Use full URL for server-side requests
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/persist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels, timestamp: new Date().toISOString() })
      });
      
      if (response.ok) {
        console.log('Channels saved to server memory');
      } else {
        console.warn('Failed to save channels to server memory:', response.status);
      }
    } catch (error) {
      console.warn('Failed to persist channels to API:', error);
    }
  }

  async loadChannels(): Promise<string[] | null> {
    // Try to load from API first
    try {
      // Use full URL for server-side requests
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/persist`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.channels) {
          return result.channels;
        }
      }
    } catch (error) {
      console.warn('Failed to load channels from API, trying localStorage:', error);
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('scopedash_channels');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.warn('Failed to parse localStorage channels data:', error);
        }
      }
    }

    return null;
  }

  async saveData(data: TikTokData): Promise<void> {
    // Save to localStorage immediately if in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('scopedash_data', JSON.stringify(data));
        localStorage.setItem('scopedash_data_timestamp', new Date().toISOString());
        console.log('Data saved to localStorage');
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }

    // Save to API endpoint for server persistence
    try {
      // Use full URL for server-side requests
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/persist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, timestamp: new Date().toISOString() })
      });
      
      if (response.ok) {
        console.log('Data saved to server memory');
      } else {
        console.warn('Failed to save to server memory:', response.status);
      }
    } catch (error) {
      console.warn('Failed to persist to API:', error);
    }
  }

  async loadData(): Promise<TikTokData | null> {
    // Try to load from API first
    try {
      // Use full URL for server-side requests
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/persist`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load from API, trying localStorage:', error);
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('scopedash_data');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.warn('Failed to parse localStorage data:', error);
        }
      }
    }

    return null;
  }
}

export const storage = PersistentStorage.getInstance();

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