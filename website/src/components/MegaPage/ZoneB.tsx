import React from 'react';

const ZoneB: React.FC = () => (
    <div className="w-full bg-[#F7F7F7] border-y border-black py-4 mb-16 mt-8">
        <div className="max-w-[1200px] mx-auto flex items-center gap-6 px-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center text-white flex-shrink-0 text-xl">🎙️</div>
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#326891]">The Daily</span>
                    <span className="font-sans text-[10px] text-gray-500 uppercase">Audio</span>
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Morning Pulse Briefing: What You Need To Know</h3>
            </div>

            <button className="hidden md:flex items-center gap-2 px-6 py-2 bg-black text-white font-sans text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">
                Listen Now
            </button>
        </div>
    </div>
);

export default ZoneB;
