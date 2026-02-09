import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { storage, type TikTokData } from '../../../../lib/supabase';
import fs from 'fs';
import path from 'path';

// Allow up to 5 minutes for Apify scraping (requires Vercel Pro for >60s)
export const maxDuration = 300;

const PROFILES = [
    "matchupvault",
    "wrestler.trivia",
    "callthemoment",
    "street.slamdown",
    "ragequitguy",
    "celebolution",
    "nearmiss529",
    "arena.fever"
];

const BASE_ACTOR_INPUT = {
    excludePinnedPosts: false,
    oldestPostDateUnified: "60 days",
    profileScrapeSections: ["videos"],
    profileSorting: "latest",
    proxyCountryCode: "None",
    resultsPerPage: 100,
    scrapeRelatedVideos: false,
    shouldDownloadAvatars: true,
    shouldDownloadCovers: true,
    shouldDownloadMusicCovers: false,
    shouldDownloadSlideshowImages: false,
    shouldDownloadSubtitles: false,
    shouldDownloadVideos: false
};

interface ApifyItem {
    id?: string;
    text?: string;
    createTime?: number;
    createTimeISO?: string;
    diggCount?: number;
    shareCount?: number;
    commentCount?: number;
    playCount?: number;
    collectCount?: number;
    webVideoUrl?: string;
    videoMeta?: { coverUrl?: string };
    authorMeta?: {
        name?: string;
        nickName?: string;
        avatar?: string;
        signature?: string;
        fans?: number;
        following?: number;
        heart?: number;
        video?: number;
    };
}

async function fetchSingleProfile(client: ApifyClient, profile: string): Promise<ApifyItem[]> {
    console.log(`[START] Scraping profile: ${profile}`);

    const runInput = {
        ...BASE_ACTOR_INPUT,
        profiles: [profile]
    };

    try {
        const run = await client.actor("GdWCkxBtKWOsKjdch").call(runInput);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`[DONE] Finished ${profile}: Found ${items.length} items`);
        return items as ApifyItem[];
    } catch (error) {
        console.error(`[ERROR] Failed to scrape ${profile}:`, error);
        return [];
    }
}

function transformData(items: ApifyItem[]) {
    const processedData: {
        metadata: { last_updated: string; profile_count: number };
        profiles: Record<string, {
            name: string;
            nickname?: string;
            avatar?: string;
            signature?: string;
            fans: number;
            following: number;
            heart: number;
            video: number;
            videos: Array<{
                id?: string;
                desc?: string;
                createTime?: number;
                createTimeISO?: string;
                stats: { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number };
                videoUrl?: string;
                coverUrl?: string;
                author: string;
            }>;
        }>;
        all_videos: Array<{
            id?: string;
            desc?: string;
            createTime?: number;
            createTimeISO?: string;
            stats: { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number };
            videoUrl?: string;
            coverUrl?: string;
            author: string;
        }>;
    } = {
        metadata: {
            last_updated: new Date().toISOString(),
            profile_count: PROFILES.length
        },
        profiles: {},
        all_videos: []
    };

    for (const item of items) {
        const author = item.authorMeta;
        const authorName = author?.name;

        if (!authorName) continue;

        if (!processedData.profiles[authorName]) {
            processedData.profiles[authorName] = {
                name: authorName,
                nickname: author?.nickName,
                avatar: author?.avatar,
                signature: author?.signature,
                fans: author?.fans || 0,
                following: author?.following || 0,
                heart: author?.heart || 0,
                video: author?.video || 0,
                videos: []
            };
        }

        const videoData = {
            id: item.id,
            desc: item.text,
            createTime: item.createTime,
            createTimeISO: item.createTimeISO,
            stats: {
                diggCount: item.diggCount || 0,
                shareCount: item.shareCount || 0,
                commentCount: item.commentCount || 0,
                playCount: item.playCount || 0,
                collectCount: item.collectCount || 0
            },
            videoUrl: item.webVideoUrl,
            coverUrl: item.videoMeta?.coverUrl,
            author: authorName
        };

        processedData.profiles[authorName].videos.push(videoData);
        processedData.all_videos.push(videoData);
    }

    processedData.all_videos.sort((a, b) => (b.stats.playCount || 0) - (a.stats.playCount || 0));

    return processedData;
}

export async function POST(request: Request) {
    let apiKey: string;
    
    try {
        const body = await request.json();
        apiKey = body.apiKey || process.env.APIFY_API_KEY;
    } catch {
        apiKey = process.env.APIFY_API_KEY || '';
    }

    if (!apiKey) {
        return NextResponse.json(
            { success: false, error: 'APIFY_API_KEY not provided. Please set your API key in Settings.' },
            { status: 400 }
        );
    }

    try {
        console.log("Starting Apify refresh...");
        const client = new ApifyClient({ token: apiKey });

        // Fetch all profiles in parallel
        const results = await Promise.all(
            PROFILES.map(profile => fetchSingleProfile(client, profile))
        );

        const allItems = results.flat();
        console.log(`Total items fetched: ${allItems.length}`);

        const transformedData = transformData(allItems);

        // Save the data using our simple persistent storage
        if (Object.keys(transformedData.profiles).length > 0 || transformedData.all_videos.length > 0) {
            try {
                // Save using localStorage + in-memory storage
                await storage.saveData(transformedData);
                console.log('Successfully saved data to persistent storage');

                // Also try to save to file for local development
                try {
                    const publicDataPath = path.join(process.cwd(), 'public/data.json');
                    fs.writeFileSync(publicDataPath, JSON.stringify(transformedData, null, 2), 'utf8');
                    console.log('Also saved to public/data.json for local development');
                } catch (fileError) {
                    console.warn('Failed to save to file (expected in production):', fileError.message);
                }

                console.log(`Profiles: ${Object.keys(transformedData.profiles).length}, Videos: ${transformedData.all_videos.length}`);

            } catch (saveError) {
                console.error('Failed to save data:', saveError);
                // Don't fail the request if we can't save
            }
        } else {
            console.log('Skipping data save - no profiles or videos found (likely invalid API key)');
        }

        return NextResponse.json({
            success: true,
            message: 'Data refreshed successfully',
            data: transformedData
        });
    } catch (error) {
        console.error('Failed to refresh data:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
