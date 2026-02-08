import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channels, apiKey } = body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No channels provided' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'APIFY_API_KEY not provided' },
        { status: 400 }
      );
    }

    // Read the current refresh route to get existing profiles
    const refreshRoutePath = path.join(process.cwd(), 'src/app/api/refresh/route.ts');
    let refreshContent = fs.readFileSync(refreshRoutePath, 'utf8');

    // Extract current PROFILES array
    const profilesMatch = refreshContent.match(/const PROFILES = \[([\s\S]*?)\];/);
    if (!profilesMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not find PROFILES array in refresh route' },
        { status: 500 }
      );
    }

    // Parse existing profiles
    const existingProfilesStr = profilesMatch[1];
    const existingProfiles = existingProfilesStr
      .split(',')
      .map(p => p.trim().replace(/['"]/g, ''))
      .filter(p => p.length > 0);

    // Add new channels, avoiding duplicates
    const newChannels = channels.filter((channel: string) => 
      !existingProfiles.includes(channel)
    );

    if (newChannels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All channels already exist' },
        { status: 400 }
      );
    }

    // Create updated profiles array
    const updatedProfiles = [...existingProfiles, ...newChannels];
    const updatedProfilesStr = updatedProfiles
      .map(profile => `"${profile}"`)
      .join(',\n    ');

    // Update the file content
    const updatedContent = refreshContent.replace(
      /const PROFILES = \[[\s\S]*?\];/,
      `const PROFILES = [\n    ${updatedProfilesStr}\n];`
    );

    // Write the updated content back to the file
    fs.writeFileSync(refreshRoutePath, updatedContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newChannels.length} new channel(s)`,
      newChannels,
      totalChannels: updatedProfiles.length
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