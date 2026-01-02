"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Video, Profile } from '@/types';

interface ChartsProps {
    videos: Video[];
    profiles: Profile[];
    type: 'bar' | 'pie';
}

const COLORS = ['#00F0FF', '#00FF9D', '#FCEE0A', '#FF0055', '#FFFFFF'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0D0F12] border border-[#00F0FF] p-2 rounded-md shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <p className="font-['JetBrains_Mono'] text-[#00F0FF] text-xs">{label}</p>
                <p className="font-['Rajdhani'] text-white font-bold">
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export const PerformanceBarChart: React.FC<{ videos: Video[] }> = ({ videos }) => {
    // Top 10 videos by play count
    const data = videos
        .slice(0, 10)
        .map(v => ({
            name: v.desc.substring(0, 10) + '...',
            views: v.stats.playCount,
            fullDesc: v.desc
        }));

    return (
        <div className="h-[300px] w-full bg-[#0D0F12]/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00F0FF]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00F0FF]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00F0FF]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00F0FF]"></div>

            <h3 className="font-['JetBrains_Mono'] text-[#00F0FF] text-xs mb-4 uppercase tracking-widest">[ TOP_10_ASSETS_BY_VIEWS ]</h3>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="JetBrains Mono"
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="JetBrains Mono"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 240, 255, 0.1)' }} />
                    <Bar dataKey="views" fill="#00F0FF" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const AccountSharePieChart: React.FC<{ profiles: Profile[] }> = ({ profiles }) => {
    const data = profiles.map(p => ({
        name: p.nickname,
        value: p.heart // Using Total Likes as the metric for "Share"
    }));

    return (
        <div className="h-[300px] w-full bg-[#0D0F12]/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00FF9D]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00FF9D]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00FF9D]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00FF9D]"></div>

            <h3 className="font-['JetBrains_Mono'] text-[#00FF9D] text-xs mb-4 uppercase tracking-widest">[ ENGAGEMENT_DISTRIBUTION_BY_UNIT ]</h3>

            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="rect"
                        formatter={(value) => <span className="text-slate-400 font-['JetBrains_Mono'] text-[10px] uppercase">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
