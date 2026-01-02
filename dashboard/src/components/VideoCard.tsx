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

            {/* HEADER: RANK (Left) & VIEWS (Right) - BIGGER & BOLDER */}
            <div className="bg-[#0A0C10] px-4 py-4 flex justify-between items-center border-b-2 border-slate-800">

                {/* Rank Badge - Increased Size */}
                <div className="flex items-center justify-center w-20 h-20 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                    <span className="text-[#00F0FF] font-['Rajdhani'] font-black text-6xl leading-none pt-1">#{rank}</span>
                </div>

                {/* Views - Increased Size with Icon */}
                <div className="flex items-center gap-4">
                    {/* Eyeball Icon */}
                    <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-white font-['Rajdhani'] font-black text-7xl leading-none tracking-tight shadow-black drop-shadow-sm">{formatNumber(video.stats.playCount)}</span>
                </div>

            </div>

            {/* EMBED CONTAINER */}
            <div className="flex justify-center bg-black min-h-[580px]">
                <blockquote
                    className="tiktok-embed"
                    cite={embedUrl}
                    data-video-id={video.id}
                    data-embed-from="embed_page"
                    style={{ maxWidth: '605px', minWidth: '325px', margin: 0 }}
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
