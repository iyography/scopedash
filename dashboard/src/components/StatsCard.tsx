import React from 'react';

interface StatProps {
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'slate';
    icon?: React.ReactNode;
    size?: 'normal' | 'large' | 'huge' | 'horizontal';
}

export const StatsCard: React.FC<StatProps> = ({ label, value, color = 'blue', icon, size = 'normal' }) => {
    const colors = {
        blue: 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.1)]',
        green: 'border-[#00FF9D] text-[#00FF9D] bg-[#00FF9D]/10 shadow-[0_0_15px_rgba(0,255,157,0.1)]',
        yellow: 'border-[#FCEE0A] text-[#FCEE0A] bg-[#FCEE0A]/10 shadow-[0_0_15px_rgba(252,238,10,0.1)]',
        red: 'border-[#FF0055] text-[#FF0055] bg-[#FF0055]/10 shadow-[0_0_15px_rgba(255,0,85,0.1)]',
        slate: 'border-slate-500 text-slate-400 bg-slate-800/10 shadow-[0_0_15px_rgba(148,163,184,0.1)]',
    };

    const bgcolors = {
        blue: 'bg-[#00F0FF]',
        green: 'bg-[#00FF9D]',
        yellow: 'bg-[#FCEE0A]',
        red: 'bg-[#FF0055]',
        slate: 'bg-slate-400',
    }

    let valueSizeClass = 'text-2xl md:text-3xl';
    let labelSizeClass = 'text-xs mb-1 text-left';
    let containerClass = 'flex flex-col justify-start items-start';
    let heightClass = '';

    if (size === 'large') {
        valueSizeClass = 'text-4xl md:text-5xl lg:text-6xl';
        labelSizeClass = 'text-sm mb-2';
    } else if (size === 'huge') {
        valueSizeClass = 'text-[5rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] tracking-tighter loading-none';
        labelSizeClass = 'text-xl md:text-2xl mb-4 tracking-[0.3em] text-center opacity-80';
        containerClass = 'flex flex-col justify-center items-center h-full w-full';
        heightClass = 'min-h-[400px]';
    } else if (size === 'horizontal') {
        // SCALED DOWN HORIZONTAL
        // Previous was text-[10rem], scaling down to more reasonable size
        valueSizeClass = 'text-5xl md:text-6xl lg:text-7xl tracking-tighter loading-none';
        labelSizeClass = 'text-xs md:text-sm tracking-[0.2em] text-center opacity-70 mb-0';
        containerClass = 'flex flex-col justify-center items-center h-full w-full';
        heightClass = 'h-[120px] py-1'; // Reduced height significantly
    }

    return (
        <div className={`border border-slate-800 border-l-4 relative overflow-hidden group hover:bg-slate-900 transition-colors backdrop-blur-sm ${colors[color].split(' shadow')[0]} ${colors[color].split(' ')[3]} ${heightClass} p-2`}>
            <div className={containerClass}>
                <div className={`text-slate-300 font-['JetBrains_Mono'] uppercase font-bold ${labelSizeClass}`}>{label}</div>
                <div className={`${valueSizeClass} font-bold text-white font-['Rajdhani'] flex items-center gap-2 group-hover:scale-105 transition-transform origin-center drop-shadow-md leading-[0.8]`}>
                    {value}
                </div>
            </div>

            {/* Background Graphic - Adjusted for Horizontal Layout */}
            <div className={`absolute -right-8 -bottom-8 w-24 h-24 opacity-5 rounded-full border-[8px] ${colors[color].split(' ')[0]}`}></div>
            <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse ${bgcolors[color]}`}></div>
        </div>
    );
};
