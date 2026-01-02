import React, { useEffect, useRef } from 'react';
import { Video } from '@/types';

interface PlaybackModalProps {
    video: Video;
    onClose: () => void;
}

export const PlaybackModal: React.FC<PlaybackModalProps> = ({ video, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load the TikTok embed script
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [video.id]);

    // Construct the embed URL (fallback if videoUrl is not the web link)
    // Apify usually returns webVideoUrl as https://www.tiktok.com/@user/video/id
    // But to be safe we can use the canonical format for the cite
    const canonicalUrl = `https://www.tiktok.com/@${video.author}/video/${video.id}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            {/* Modal Content */}
            <div className="relative bg-[#0D0F12] border border-[#00F0FF] rounded-lg shadow-[0_0_50px_rgba(0,240,255,0.2)] max-h-[90vh] overflow-y-auto scrollbar-none" onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-[#FF0055] text-white rounded-full transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Embed Container */}
                <div className="p-1 min-w-[340px] min-h-[600px] flex items-center justify-center bg-black">
                    <blockquote
                        className="tiktok-embed"
                        cite={canonicalUrl}
                        data-video-id={video.id}
                        style={{ maxWidth: '605px', minWidth: '325px' }}
                    >
                        <section>
                            <a target="_blank" title={`@${video.author}`} href={`https://www.tiktok.com/@${video.author}?refer=embed`}>@{video.author}</a>
                            <p>{video.desc}</p>
                            <a target="_blank" title="♬ original sound" href={`https://www.tiktok.com/music/original-sound-${video.id}?refer=embed`}>♬ original sound</a>
                        </section>
                    </blockquote>
                </div>
            </div>
        </div>
    );
};
