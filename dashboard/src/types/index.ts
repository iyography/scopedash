export interface VideoStats {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
    collectCount: number;
}

export interface Video {
    id: string;
    desc: string;
    createTime: number;
    createTimeISO: string;
    stats: VideoStats;
    videoUrl: string;
    coverUrl: string;
    author: string;
}

export interface Profile {
    name: string;
    nickname: string;
    avatar: string;
    signature: string;
    fans: number;
    following: number;
    heart: number;
    video: number;
    videos: Video[];
}

export interface DashboardData {
    metadata: {
        last_updated: string;
        profile_count: number;
    };
    profiles: Record<string, Profile>;
    all_videos: Video[];
}
