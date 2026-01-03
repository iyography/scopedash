import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
    try {
        console.log("Triggering refresh...");

        // We assume the Next.js process is running in <root>/dashboard
        // We want to execute the script from <root> so it finds .env and writes to dashboard/public correctly
        const projectRoot = path.resolve(process.cwd(), '..');

        console.log(`Executing scraper from root: ${projectRoot}`);

        const { stdout, stderr } = await execPromise('python3 execution/fetch_tiktok_data.py', {
            cwd: projectRoot
        });

        console.log('Scraper output:', stdout);
        if (stderr) console.error('Scraper error output:', stderr);

        return NextResponse.json({ success: true, message: 'Data refreshed successfully' });
    } catch (error) {
        console.error('Failed to run scraper:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to refresh data' },
            { status: 500 }
        );
    }
}
