import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { backupFile } = body;

        if (!backupFile) {
            return NextResponse.json(
                { success: false, error: 'No backup file specified' },
                { status: 400 }
            );
        }

        const backupPath = path.join(process.cwd(), 'public', backupFile);
        const dataPath = path.join(process.cwd(), 'public/data.json');

        if (!fs.existsSync(backupPath)) {
            return NextResponse.json(
                { success: false, error: 'Backup file not found' },
                { status: 404 }
            );
        }

        // Read backup and restore it
        const backupData = fs.readFileSync(backupPath, 'utf8');
        fs.writeFileSync(dataPath, backupData, 'utf8');

        return NextResponse.json({
            success: true,
            message: `Successfully restored data from ${backupFile}`
        });

    } catch (error) {
        console.error('Restore backup error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // List available backups
        const publicDir = path.join(process.cwd(), 'public');
        const backupFiles = fs.readdirSync(publicDir)
            .filter(f => f.startsWith('data-backup-'))
            .map(file => {
                const stats = fs.statSync(path.join(publicDir, file));
                return {
                    file,
                    created: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.created.getTime() - a.created.getTime());

        return NextResponse.json({
            success: true,
            backups: backupFiles
        });

    } catch (error) {
        console.error('List backups error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}