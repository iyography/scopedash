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
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedProfile, setSelectedProfile] = useState<string | 'all'>('all');

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/data.json');
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const res = await fetch('/api/refresh', { method: 'POST' });
            if (res.ok) {
                // Wait for file system to sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                await loadData();
                setRefreshKey(prev => prev + 1); // Force remount of embeds
            } else {
                console.error("Refresh failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    const profiles = data ? Object.values(data.profiles) : [];

    // ... (videoLists useMemo remains the same)
    // --- PRE-CALCULATE ALL VIDEO LISTS ---
    // This allows us to render ALL grids at once and just toggle visibility
    const videoLists = useMemo(() => {
        if (!data) return {};

        const lists: Record<string, Video[]> = {};

        // 1. "ALL" List (Top 6 from everyone)
        // CRITICAL FIX: Make sure we don't mutate the original profile videos
        const allTopVideos: Video[] = [];
        const topFromEach = profiles.map(p => {
            if (!p.videos || p.videos.length === 0) return null;
            // Create a copy before sorting!
            return [...p.videos].sort((a, b) => b.stats.playCount - a.stats.playCount)[0];
        }).filter(Boolean) as Video[];

        allTopVideos.push(...topFromEach);

        if (allTopVideos.length < 6) {
            const usedIds = new Set(allTopVideos.map(v => v.id));
            const remainingVideos = data.all_videos
                .filter(v => !usedIds.has(v.id))
                .sort((a, b) => b.stats.playCount - a.stats.playCount);

            allTopVideos.push(...remainingVideos.slice(0, 6 - allTopVideos.length));
        }

        // Final sort to ensure rank #1 is actually highest views
        allTopVideos.sort((a, b) => b.stats.playCount - a.stats.playCount);
        lists['all'] = allTopVideos.slice(0, 6);

        // 2. Individual Profile Lists
        profiles.forEach(p => {
            if (p.videos) {
                // strict safe sort
                lists[p.name] = [...p.videos]
                    .sort((a, b) => b.stats.playCount - a.stats.playCount)
                    .slice(0, 6);
            } else {
                lists[p.name] = [];
            }
        });

        return lists;
    }, [data, profiles]);


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

    }, [data, selectedProfile, refreshKey]); // Re-trigger on profile change OR refresh to catch visibility changes


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
            {/* REFRESH OVERLAY */}
            {refreshing && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 border-4 border-t-[#00F0FF] border-r-[#00FF9D] border-b-[#FCEE0A] border-l-[#FF0055] rounded-full animate-spin"></div>
                        <div className="text-white font-['JetBrains_Mono'] text-2xl tracking-[0.2em] animate-pulse">
                            UPDATING INTELLIGENCE...
                        </div>
                    </div>
                </div>
            )}

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

            <main className="w-full px-4 py-6 flex flex-col items-center gap-8" style={{ zoom: '0.75' }}>

                {/* Header Info */}
                <header className="w-full max-w-[1600px] flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                            SCOPEDASH
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* REFRESH BUTTON */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={`text-slate-500 hover:text-[#00F0FF] transition-all duration-300`}
                            title="Refresh Data"
                        >
                            <svg
                                className={refreshing ? 'animate-spin text-[#00F0FF]' : ''}
                                xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                            </svg>
                        </button>

                        <div className="text-[#00FF9D] font-['JetBrains_Mono'] text-[10px] tracking-wider flex items-center justify-end gap-1">
                            ONLINE <span className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse"></span>
                        </div>
                    </div>
                </header>

                {/* Stats Cards Wrapper for Spacing */}
                <div className="w-full max-w-[1600px] pb-16">
                    <div className="grid grid-cols-4 gap-4">
                        <StatsCard label="TOTAL FOLLOWERS" value={(totalFollowers >= 1000000 ? (totalFollowers / 1000000).toFixed(1) + 'M' : totalFollowers >= 1000 ? (totalFollowers / 1000).toFixed(1) + 'K' : totalFollowers.toLocaleString())} color="slate" size="horizontal" />
                        <StatsCard label="TOTAL VIEWS" value={(totalViews >= 1000000 ? (totalViews / 1000000).toFixed(1) + 'M' : totalViews >= 1000 ? (totalViews / 1000).toFixed(1) + 'K' : totalViews.toLocaleString())} color="blue" size="horizontal" />
                        <StatsCard label="TOTAL LIKES" value={(totalLikes >= 1000000 ? (totalLikes / 1000000).toFixed(1) + 'M' : totalLikes >= 1000 ? (totalLikes / 1000).toFixed(1) + 'K' : totalLikes.toLocaleString())} color="green" size="horizontal" />
                        <StatsCard label="TOTAL COMMENTS" value={(totalComments >= 1000000 ? (totalComments / 1000000).toFixed(1) + 'M' : totalComments >= 1000 ? (totalComments / 1000).toFixed(1) + 'K' : totalComments.toLocaleString())} color="yellow" size="horizontal" />
                    </div>
                </div>

                {/* Top Assets - PERSISTENT GRIDS */}
                {/* Top Assets - PERSISTENT GRIDS */}
                <div className="w-full max-w-[1600px] relative" key={refreshKey}>
                    {/* "ALL" Grid */}
                    <div className={selectedProfile === 'all' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-6 justify-center gap-3">
                            {videoLists['all']?.map((video, index) => (
                                <div key={`${video.id}-all`} style={{ width: '100%' }}>
                                    <VideoCard video={video} rank={index + 1} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Individual Profile Grids */}
                    {profiles.map(p => (
                        <div key={p.name} className={selectedProfile === p.name ? 'block' : 'hidden'}>
                            <div className="grid grid-cols-6 justify-center gap-3">
                                {videoLists[p.name]?.map((video, index) => (
                                    <div key={`${video.id}-${p.name}`} style={{ width: '100%' }}>
                                        <VideoCard video={video} rank={index + 1} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );

}
