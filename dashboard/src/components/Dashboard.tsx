"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DashboardData, Video } from '@/types';
import { VideoCard } from './VideoCard';
import { StatsCard } from './StatsCard';

// Global declaration for TikTok script
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

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<string | 'all'>('all');

    useEffect(() => {
        fetch('/data.json')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const profiles = data ? Object.values(data.profiles) : [];

    // --- PRE-CALCULATE ALL VIDEO LISTS ---
    // This allows us to render ALL grids at once and just toggle visibility
    const videoLists = useMemo(() => {
        if (!data) return {};

        const lists: Record<string, Video[]> = {};

        // 1. "ALL" List (Top 6 from everyone)
        const allTopVideos: Video[] = [];
        const topFromEach = profiles.map(p => {
            if (!p.videos || p.videos.length === 0) return null;
            return p.videos.sort((a, b) => b.stats.playCount - a.stats.playCount)[0];
        }).filter(Boolean) as Video[];

        allTopVideos.push(...topFromEach);

        if (allTopVideos.length < 6) {
            const usedIds = new Set(allTopVideos.map(v => v.id));
            const remainingVideos = data.all_videos
                .filter(v => !usedIds.has(v.id))
                .sort((a, b) => b.stats.playCount - a.stats.playCount);

            allTopVideos.push(...remainingVideos.slice(0, 6 - allTopVideos.length));
        }
        allTopVideos.sort((a, b) => b.stats.playCount - a.stats.playCount);
        lists['all'] = allTopVideos.slice(0, 6);

        // 2. Individual Profile Lists
        profiles.forEach(p => {
            if (p.videos) {
                lists[p.name] = [...p.videos]
                    .sort((a, b) => b.stats.playCount - a.stats.playCount)
                    .slice(0, 6);
            } else {
                lists[p.name] = [];
            }
        });

        return lists;
    }, [data]);


    // --- FILTERED STATS ---
    // Stats still update dynamically based on selection
    const displayedVideos = (data && selectedProfile === 'all')
        ? data.all_videos
        : (data && data.profiles[selectedProfile]?.videos) || [];

    const totalViews = displayedVideos.reduce((acc, v) => acc + v.stats.playCount, 0);
    const totalLikes = displayedVideos.reduce((acc, v) => acc + v.stats.diggCount, 0);
    const totalComments = displayedVideos.reduce((acc, v) => acc + v.stats.commentCount, 0);

    let totalFollowers = 0;
    if (data) {
        if (selectedProfile === 'all') {
            totalFollowers = profiles.reduce((acc, p) => acc + p.fans, 0);
        } else {
            totalFollowers = data.profiles[selectedProfile]?.fans || 0;
        }
    }


    // --- SINGLE GLOBAL EMBED LOADER ---
    useEffect(() => {
        if (!data) return;

        const scriptId = 'tiktok-embed-script';
        const existingScript = document.getElementById(scriptId);

        const attemptRender = () => {
            console.log("Triggering TikTok Render...");
            if (window.tiktokEmbed && window.tiktokEmbed.lib && typeof window.tiktokEmbed.lib.render === 'function') {
                window.tiktokEmbed.lib.render();
            } else if (window.tiktokEmbed && typeof window.tiktokEmbed.load === 'function') {
                window.tiktokEmbed.load();
            }
        };

        const triggerAggressiveRender = () => {
            setTimeout(attemptRender, 100);
            setTimeout(attemptRender, 500);
            setTimeout(attemptRender, 1500);
            setTimeout(attemptRender, 3000);
        };

        if (!existingScript) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            script.onload = triggerAggressiveRender;
            document.body.appendChild(script);
        } else {
            // Even if script exists, we trigger render when profile changes
            // ensuring any newly visible (display: block) elements are caught
            triggerAggressiveRender();
        }

    }, [data, selectedProfile]); // Re-trigger on profile change to catch visibility changes


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-[#00F0FF] font-['JetBrains_Mono'] tracking-widest uppercase bg-[#0D0F12]">
            <span className="animate-pulse">Initializing System...</span>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center text-[#FF0055] font-['JetBrains_Mono'] bg-[#0D0F12]">
            [ERROR] DATA_LINK_SEVERED
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0D0F12] pb-10 overflow-x-hidden flex flex-col items-center">
            {/* Sticky Top Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0D0F12]/95 backdrop-blur-xl border-b border-slate-800 shadow-xl py-2 w-full flex justify-center">
                <div className="w-full max-w-[1400px] px-4 flex justify-center">
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar p-2">

                        <button
                            onClick={() => setSelectedProfile('all')}
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                padding: 0,
                                outline: 'none',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}
                            className={`transition-all duration-300 group shrink-0 ${selectedProfile === 'all' ? 'opacity-100 z-10' : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: selectedProfile === 'all' ? '2px solid white' : '2px solid #334155',
                                    backgroundColor: selectedProfile === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    color: selectedProfile === 'all' ? 'white' : '#94a3b8',
                                    backgroundClip: 'padding-box',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>ALL</span>
                            </div>
                        </button>

                        {/* Profiles */}
                        {profiles.map(p => (
                            <button
                                key={p.name}
                                onClick={() => setSelectedProfile(p.name)}
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    padding: 0,
                                    outline: 'none',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    marginLeft: '8px',
                                    marginRight: '8px'
                                }}
                                className={`transition-all duration-300 shrink-0 ${selectedProfile === p.name
                                    ? 'opacity-100 z-10'
                                    : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105'
                                    }`}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        border: selectedProfile === p.name ? '4px solid #FCEE0A' : '2px solid #334155',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: selectedProfile === p.name ? '0 0 15px rgba(252, 238, 10, 0.4)' : 'none'
                                    }}
                                >
                                    <img
                                        src={p.avatar}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="w-full px-4 py-6 flex flex-col items-center gap-8">

                {/* Header Info */}
                <header className="w-full max-w-[1600px] flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                            SCOPEDASH <span className="text-slate-700">v4.10</span>
                        </h1>
                    </div>
                    <div className="text-[#00FF9D] font-['JetBrains_Mono'] text-[10px] tracking-wider flex items-center justify-end gap-1">
                        ONLINE <span className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse"></span>
                    </div>
                </header>

                {/* MAIN STATS - 4 ACROSS HORIZONTAL */}
                <div className="w-full max-w-[1600px] grid grid-cols-4 gap-4">
                    <StatsCard label="TOTAL FOLLOWERS" value={(totalFollowers >= 1000000 ? (totalFollowers / 1000000).toFixed(1) + 'M' : totalFollowers.toLocaleString())} color="slate" size="horizontal" />
                    <StatsCard label="TOTAL VIEWS" value={(totalViews >= 1000000 ? (totalViews / 1000000).toFixed(1) + 'M' : totalViews.toLocaleString())} color="blue" size="horizontal" />
                    <StatsCard label="TOTAL LIKES" value={(totalLikes >= 1000000 ? (totalLikes / 1000000).toFixed(1) + 'M' : totalLikes.toLocaleString())} color="green" size="horizontal" />
                    <StatsCard label="TOTAL COMMENTS" value={(totalComments >= 1000 ? (totalComments / 1000).toFixed(1) + 'K' : totalComments.toLocaleString())} color="yellow" size="horizontal" />
                </div>

                {/* Top Assets - PERSISTENT GRIDS */}
                <div className="w-full border-t border-slate-800 pt-6 flex flex-col items-center">
                    <div className="flex justify-center items-center mb-6">
                        <h3 className="font-['Rajdhani'] font-bold text-3xl text-white uppercase flex items-center gap-3 tracking-wide text-shadow-glow">
                            <span className="text-[#FCEE0A] drop-shadow-[0_0_10px_rgba(252,238,10,0.8)]">★</span> Top Embeds
                        </h3>
                    </div>

                    {/* 
                        PERSISTENT RENDERING STRATEGY:
                        We render a container for 'all' and for every profile.
                        We hide/show them using CSS (className hidden/flex).
                        This keeps TIkTok embeds ALIVE in the DOM so they don't reload.
                    */}

                    {/* 1. ALL GRID */}
                    <div className={`w-full flex-wrap justify-center gap-4 ${selectedProfile === 'all' ? 'flex' : 'hidden'}`}>
                        {videoLists['all']?.map((video, index) => (
                            <div key={`all-${video.id}`} className="relative flex-grow-0 flex-shrink-0" style={{ width: '330px' }}>
                                <VideoCard video={video} rank={index + 1} />
                            </div>
                        ))}
                    </div>

                    {/* 2. PROFILE GRIDS */}
                    {profiles.map(p => (
                        <div
                            key={`grid-${p.name}`}
                            className={`w-full flex-wrap justify-center gap-4 ${selectedProfile === p.name ? 'flex' : 'hidden'}`}
                        >
                            {videoLists[p.name]?.map((video, index) => (
                                <div key={`${p.name}-${video.id}`} className="relative flex-grow-0 flex-shrink-0" style={{ width: '330px' }}>
                                    <VideoCard video={video} rank={index + 1} />
                                </div>
                            ))}
                        </div>
                    ))}

                </div>
            </main>
        </div>
    );
}
