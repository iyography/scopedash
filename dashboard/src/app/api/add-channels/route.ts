import { NextResponse } from 'next/server';
import { serverStorage } from '../../../../lib/server-storage';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channels } = body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No channels provided' },
        { status: 400 }
      );
    }

    // API key is not required just to add channels to the list
    // It's only needed when refreshing/scraping data

    // Add new channels using server storage
    const newChannels = serverStorage.addChannels(channels);

    if (newChannels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All channels already exist' },
        { status: 400 }
      );
    }

    const totalChannels = serverStorage.getChannels().length;

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newChannels.length} new channel(s)`,
      newChannels,
      totalChannels
    });

  } catch (error) {
    console.error('Add channels error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}