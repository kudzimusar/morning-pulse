import React from 'react';
import { NewsStory, Opinion } from '../../types';

interface ZoneCProps {
    centerArticle: NewsStory;
    leftArticles: NewsStory[];
    rightOpinions: Opinion[];
}

const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : 'P');

export const ZoneC: React.FC<ZoneCProps> = ({ centerArticle, leftArticles, rightOpinions }) => (
    <section className="mb-16">
        {/* Horizontal Sub Nav */}
        <div className="border-t-2 border-black border-b border-gray-200 py-3 mb-8 overflow-x-auto no-scrollbar">
            <div className="flex gap-6 font-sans text-xs whitespace-nowrap px-4 lg:px-0">
                <span className="font-bold cursor-pointer text-black uppercase tracking-widest">In-Depth Analysis</span>
                <span className="text-gray-500 cursor-pointer hover:text-black uppercase tracking-widest">Politics</span>
                <span className="text-gray-500 cursor-pointer hover:text-black uppercase tracking-widest">Markets</span>
                <span className="text-gray-500 cursor-pointer hover:text-black uppercase tracking-widest">Technology</span>
            </div>
        </div>

        {/* Apply strict grid */}
        <div className="zone-grid-1-2-1">
            {/* Left Rail: 3 text-only stories */}
            <div className="flex flex-col gap-4 lg:pr-6 lg:editorial-border-right">
                {leftArticles.map((article) => (
                    <article key={article.id} className="border-b border-gray-200 pb-4 last:border-0 group cursor-pointer">
                        <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider mb-2 block font-sans">
                            {article.category || 'News'}
                        </span>
                        <h3 className="text-[17px] font-bold leading-snug mb-2 group-hover:underline text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                            {article.headline || article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                            {article.summary || article.detail}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 uppercase font-sans font-bold">
                            <span>{article.source || 'Morning Pulse'}</span>
                            <span>•</span>
                            <span>3 Min Read</span>
                        </div>
                    </article>
                ))}
            </div>

            {/* Center Stage: 1 visual story */}
            <div className="lg:px-6 lg:editorial-border-right flex flex-col group cursor-pointer">
                <div className="relative w-full aspect-video mb-4 bg-gray-100 overflow-hidden">
                    {centerArticle.imageUrl || centerArticle.image || centerArticle.urlToImage ? (
                        <img
                            src={centerArticle.imageUrl || centerArticle.image || centerArticle.urlToImage}
                            alt={centerArticle.headline}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-sans text-xs uppercase tracking-widest">
                            Visual Context
                        </div>
                    )}
                </div>

                <h2 className="text-3xl lg:text-[40px] font-bold leading-tight mb-3 text-black group-hover:text-gray-700 transition-colors" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
                    {centerArticle.headline || centerArticle.title}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed max-w-2xl" style={{ fontFamily: 'Georgia, serif' }}>
                    {centerArticle.summary || centerArticle.detail}
                </p>
                <div className="text-xs font-bold uppercase text-gray-500 mt-4 font-sans tracking-wide">
                    By {centerArticle.source || 'Morning Pulse Staff'}
                </div>
            </div>

            {/* Right Rail: Opinions */}
            <div className="lg:pl-6 sticky top-24 self-start flex flex-col gap-6">
                {rightOpinions.map((opinion) => (
                    <article key={opinion.id} className="border-b border-gray-200 pb-5 last:border-0 flex gap-4 items-start group cursor-pointer">
                        <div className="flex-1">
                            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1 font-sans tracking-wide">
                                {opinion.author}
                            </span>
                            <h4 className="text-[16px] font-bold leading-tight group-hover:text-gray-500 transition-colors text-black" style={{ fontFamily: 'Georgia, serif' }}>
                                {opinion.title}
                            </h4>
                        </div>

                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                            {opinion.image ? (
                                <img src={opinion.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" alt={opinion.author} />
                            ) : (
                                <span className="font-sans font-bold text-gray-400 text-lg">
                                    {getInitial(opinion.author)}
                                </span>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    </section>
);

export default ZoneC;
