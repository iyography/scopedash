import React from 'react';
import { Video } from '@/types';

interface VideoCardProps {
    video: Video;
    rank: number;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, rank }) => {

    // Format Views
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const embedUrl = `https://www.tiktok.com/@${video.author}/video/${video.id}`;

    return (
        <div className="bg-[#0D0F12] border-2 border-slate-800 hover:border-[#FCEE0A] transition-colors duration-300 rounded-xl flex flex-col w-full overflow-hidden shadow-2xl h-full">

            {/* HEADER: RANK (Top-Left) | EYE & VIEWS (Centered) */}
            <div className="bg-[#0A0C10] flex items-center justify-center border-b border-slate-800 gap-3 overflow-hidden" style={{ height: '160px', position: 'relative' }}>

                {/* Rank Badge - Top Left & Smaller - FIXED POSITIONING - GREY THEME */}
                <div className="flex items-center justify-center rounded-lg shrink-0"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        width: '24px',
                        height: '24px',
                        border: '2px solid #808080',
                        backgroundColor: 'rgba(128, 128, 128, 0.1)'
                    }}>
                    <span className="font-['Rajdhani'] font-black leading-none pt-0.5" style={{ fontSize: '18px', color: '#808080' }}>#{rank}</span>
                </div>

                {/* Eyeball Icon - Large & Centered */}
                <div className="flex items-center justify-center shrink-0" style={{ width: '56px', height: '56px' }}>
                    <svg className="text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" style={{ width: '40px', height: '40px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>

                {/* Views - Large */}
                <span className="text-white font-['Rajdhani'] font-black leading-none tracking-tight shadow-black drop-shadow-md whitespace-nowrap" style={{ fontSize: '60px' }}>
                    {formatNumber(video.stats.playCount)}
                </span>

            </div>

            {/* AUTHOR BANNER - UNIFIED DISPLAY */}
            <div className="bg-slate-900/50 border-b border-slate-800 py-2 flex justify-center items-center">
                <span className="text-slate-300 font-['JetBrains_Mono'] font-bold text-lg tracking-wider">
                    @{video.author}
                </span>
            </div>

            {/* EMBED CONTAINER */}
            <div className="flex justify-center bg-black min-h-[580px]">
                <blockquote
                    className="tiktok-embed"
                    cite={embedUrl}
                    data-video-id={video.id}
                    data-embed-from="embed_page"
                    style={{ maxWidth: '605px', minWidth: '200px', margin: 0 }}
                >
                    <section>
                        <a target="_blank" title={`@${video.author}`} href={`https://www.tiktok.com/@${video.author}?refer=embed`}>@{video.author}</a>
                        <p>{video.desc}</p>
                        <a target="_blank" title="♬ original sound" href={`https://www.tiktok.com/music/original-sound-${video.id}?refer=embed`}>♬ original sound</a>
                    </section>
                </blockquote>
            </div>

        </div>
    );
};
