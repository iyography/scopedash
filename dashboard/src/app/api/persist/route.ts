import { NextResponse } from 'next/server';
import { serverStorage } from '../../../../lib/server-storage';

// In-memory storage (will reset on deployment, but better than files)
let storedData: object | null = null;
let lastUpdated: string | null = null;
let storedChannels: string[] = [
    "matchupvault",
    "wrestler.trivia",
    "callthemoment",
    "street.slamdown",
    "ragequitguy",
    "celebolution",
    "nearmiss529",
    "arena.fever",
    "slidernightmare"
];
let channelsLastUpdated: string | null = null;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data, timestamp, channels } = body;

        if (!data && !channels) {
            return NextResponse.json(
                { success: false, error: 'No data or channels provided' },
                { status: 400 }
            );
        }

        // Store data in memory
        if (data) {
            storedData = data;
            lastUpdated = timestamp || new Date().toISOString();
        }

        // Store channels in server storage
        if (channels) {
            serverStorage.setChannels(channels);
            storedChannels = channels;
            channelsLastUpdated = new Date().toISOString();
        }

        return NextResponse.json({
            success: true,
            message: data && channels ? 'Data and channels persisted successfully' : 
                     data ? 'Data persisted successfully' : 'Channels persisted successfully',
            timestamp: lastUpdated,
            channelsTimestamp: channelsLastUpdated
        });

    } catch (error) {
        console.error('Failed to persist data:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            data: storedData,
            channels: serverStorage.getChannels(),
            timestamp: lastUpdated,
            channelsTimestamp: channelsLastUpdated
        });

    } catch (error) {
        console.error('Failed to load data:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}