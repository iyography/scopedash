import { NextResponse } from 'next/server';

// In-memory storage (will reset on deployment, but better than files)
let storedData: any = null;
let lastUpdated: string | null = null;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data, timestamp } = body;

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'No data provided' },
                { status: 400 }
            );
        }

        // Store in memory
        storedData = data;
        lastUpdated = timestamp || new Date().toISOString();

        return NextResponse.json({
            success: true,
            message: 'Data persisted successfully',
            timestamp: lastUpdated
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
        if (!storedData) {
            return NextResponse.json({
                success: false,
                error: 'No data available'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: storedData,
            timestamp: lastUpdated
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