import React, { useEffect } from 'react';
import { Video } from '@/types';

// Extend Window interface for TikTok global with optional chaining
declare global {
    interface Window {
        tiktokEmbed: {
            lib?: {
                render: (element?: HTMLElement[]) => void;
            };
            load?: () => void;
        };
    }
}

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

    // Ensure script is loaded and safely try to re-render
    useEffect(() => {
        const scriptId = 'tiktok-embed-script';
        const existingScript = document.getElementById(scriptId);

        const triggerRender = () => {
            // Small delay to ensure React has fully painted the new blockquotes to DOM
            setTimeout(() => {
                if (window.tiktokEmbed && window.tiktokEmbed.lib && typeof window.tiktokEmbed.lib.render === 'function') {
                    window.tiktokEmbed.lib.render();
                }
            }, 50);
        };

        if (!existingScript) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            script.onload = triggerRender;
            document.body.appendChild(script);
        } else {
            triggerRender();
        }
    }, [video.id]);

    const embedUrl = `https://www.tiktok.com/@${video.author}/video/${video.id}`;

    return (
        <div className="bg-[#0D0F12] border-2 border-slate-800 hover:border-[#FCEE0A] transition-colors duration-300 rounded-xl flex flex-col w-full overflow-hidden shadow-2xl h-full">

            {/* HEADER: RANK (Left) & VIEWS (Right) - BIGGER & BOLDER */}
            <div className="bg-[#0A0C10] px-4 py-3 flex justify-between items-center border-b-2 border-slate-800">

                {/* Rank Badge - Increased Size */}
                <div className="flex items-center justify-center w-10 h-10 bg-[#00F0FF]/10 border-2 border-[#00F0FF] rounded-lg shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    <span className="text-[#00F0FF] font-['Rajdhani'] font-black text-2xl leading-none pt-0.5">#{rank}</span>
                </div>

                {/* Views - Increased Size with Icon */}
                <div className="flex items-center gap-2">
                    {/* Eyeball Icon */}
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-white font-['Rajdhani'] font-black text-3xl leading-none tracking-tight shadow-black drop-shadow-sm">{formatNumber(video.stats.playCount)}</span>
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
