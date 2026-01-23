import { NextResponse } from 'next/server';

export async function GET() {
    const hasApiKey = !!process.env.APIFY_API_KEY;
    const apiKeyPrefix = process.env.APIFY_API_KEY?.substring(0, 10) || 'not set';

    return NextResponse.json({
        hasApiKey,
        apiKeyPrefix: apiKeyPrefix + '...',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
}
