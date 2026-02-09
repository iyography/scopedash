import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Try to get data from database first
        const { data: dbData, error: dbError } = await supabase
            .from('tiktok_data')
            .select('data, updated_at')
            .eq('id', 'current')
            .single();

        if (dbData && !dbError) {
            console.log('Successfully loaded data from database');
            return NextResponse.json({
                success: true,
                data: dbData.data,
                source: 'database',
                updated_at: dbData.updated_at
            });
        }

        // Fallback to file system if database is not available
        console.log('Database not available, trying file system fallback...');
        const publicDataPath = path.join(process.cwd(), 'public/data.json');
        
        if (fs.existsSync(publicDataPath)) {
            const fileData = JSON.parse(fs.readFileSync(publicDataPath, 'utf8'));
            console.log('Successfully loaded data from file system');
            return NextResponse.json({
                success: true,
                data: fileData,
                source: 'file',
                updated_at: null
            });
        }

        // No data available
        return NextResponse.json({
            success: false,
            error: 'No data available. Please refresh data first.',
            source: 'none'
        }, { status: 404 });

    } catch (error) {
        console.error('Failed to load data:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return NextResponse.json({
            success: false,
            error: errorMessage,
            source: 'error'
        }, { status: 500 });
    }
}