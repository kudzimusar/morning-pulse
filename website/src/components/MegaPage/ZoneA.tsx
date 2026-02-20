import React from 'react';
import { NewsStory, Opinion } from '../../types';
import AdSlot from '../AdSlot';

interface ZoneAProps {
    hero: NewsStory;
    leftRail: NewsStory[];
    rightRail: Opinion[];
}

// Helper to get initials for the missing authorImageUrl
const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : 'P');

// Helper to fix screaming caps (all-uppercase headlines)
const formatText = (text?: string) => {
    if (!text) return '';
    if (text === text.toUpperCase() && text.length > 5) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    return text;
};

const ZoneA: React.FC<ZoneAProps> = ({ hero, leftRail, rightRail }) => {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-[220px_640px_300px] gap-6 mb-16 items-start">

            {/* === LEFT RAIL: High density, text only (News items 2-5) === */}
            <div className="flex flex-col gap-4 lg:pr-6 lg:border-r border-gray-200">
                {leftRail.map((article) => (
                    <a href={article.url || '#'} target="_blank" rel="noopener noreferrer" key={article.id} className="block border-b border-gray-200 pb-4 last:border-0 group cursor-pointer focus:outline-none">
                        <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider mb-2 block font-sans">
                            {article.category || 'News'}
                        </span>
                        <h3 className="text-[17px] font-bold leading-snug mb-2 group-hover:underline text-gray-900 break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif' }}>
                            {formatText(article.headline || article.title)}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif' }}>
                            {formatText(article.summary || article.detail)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 uppercase font-sans font-bold">
                            <span>{article.source || 'Morning Pulse'}</span>
                            <span>•</span>
                            <span>3 Min Read</span>
                        </div>
                    </a>
                ))}
            </div>

            {/* === CENTER STAGE: Massive visual impact (Hero) === */}
            <a href={hero.url || '#'} target="_blank" rel="noopener noreferrer" className="lg:px-6 lg:border-r border-gray-200 flex flex-col group cursor-pointer block focus:outline-none">
                {/* Force the 3:2 image into a cinematic 16:9 crop using Tailwind */}
                <div className="relative w-full aspect-video mb-4 bg-gray-100 overflow-hidden">
                    {hero.imageUrl || hero.image || hero.urlToImage ? (
                        <img
                            src={hero.imageUrl || hero.image || hero.urlToImage}
                            alt={hero.headline}
                            fetchPriority="high"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-sans text-xs uppercase tracking-widest">
                            Visual Context
                        </div>
                    )}
                </div>

                <h2 className="text-3xl lg:text-[40px] font-bold leading-tight mb-3 text-black group-hover:text-gray-700 transition-colors break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
                    {formatText(hero.headline || hero.title)}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed max-w-2xl break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif' }}>
                    {formatText(hero.summary || hero.detail)}
                </p>
                <div className="text-xs font-bold uppercase text-gray-500 mt-4 font-sans tracking-wide">
                    By {hero.source || 'Morning Pulse Staff'}
                </div>
            </a>

            {/* === RIGHT RAIL: Sticky Opinions === */}
            <div className="lg:pl-6 sticky top-24 self-start flex flex-col gap-6">

                {/* Section Header */}
                <div className="border-t-2 border-black pt-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest block font-sans text-black">Opinion & Editorial</span>
                </div>

                {/* Right Rail Opinions */}
                {rightRail.map((opinion) => (
                    <a href={opinion.url || '#'} target="_blank" rel="noopener noreferrer" key={opinion.id} className="block border-b border-gray-200 pb-5 flex gap-4 items-start group cursor-pointer focus:outline-none">
                        <div className="flex-1">
                            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1 font-sans tracking-wide">
                                {opinion.author}
                            </span>
                            <h4 className="text-[16px] font-bold leading-tight group-hover:text-gray-500 transition-colors text-black break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif' }}>
                                {formatText(opinion.title)}
                            </h4>
                        </div>

                        {/* Fake Author Avatar - Circular UI solves missing image */}
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                            {opinion.image ? (
                                <img src={opinion.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" alt={opinion.author} loading="lazy" />
                            ) : (
                                <span className="font-sans font-bold text-gray-400 text-lg">
                                    {getInitial(opinion.author)}
                                </span>
                            )}
                        </div>
                    </a>
                ))}

                {/* Embedded AdSlot at the bottom of Right Rail */}
                <div className="mt-4 border-y border-black py-4">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-2 font-sans tracking-widest text-center">Advertisement</span>
                    <AdSlot slotId="zone_a_right_rail" label="SPONSORED" className="w-full max-w-[300px] mx-auto min-h-[250px]" />
                </div>
            </div>

        </section>
    );
};

export default ZoneA;
