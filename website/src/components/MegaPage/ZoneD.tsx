import React from 'react';
import { NewsStory } from '../../types';

interface ZoneDProps {
    featureArticle: NewsStory;
}

const ZoneD: React.FC<ZoneDProps> = ({ featureArticle }) => (
    <section className="zone-grid-merge-left mb-16 px-4 lg:px-0">

        {/* Merged Left+Center (884px) */}
        <div className="bg-gray-50 border-y border-gray-200 p-8 flex flex-col md:flex-row gap-8 items-center lg:editorial-border-right lg:pr-10 group cursor-pointer">
            <div className="md:w-1/3">
                <span className="font-sans text-[10px] font-bold uppercase text-[#326891] mb-2 block tracking-widest">Feature</span>
                <h2 className="text-3xl font-bold mb-4 leading-tight group-hover:text-gray-600 transition-colors" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
                    {featureArticle.headline || featureArticle.title}
                </h2>
                <p className="text-base text-gray-700 leading-relaxed mb-4 line-clamp-4" style={{ fontFamily: 'Georgia, serif' }}>
                    {featureArticle.summary || featureArticle.detail}
                </p>
                <span className="text-[10px] font-bold uppercase text-gray-400 font-sans tracking-wide">
                    By {featureArticle.source || 'Morning Pulse'}
                </span>
            </div>

            {/* 16:9 Image filling the rest of the merged space */}
            <div className="md:w-2/3 w-full aspect-video bg-gray-200 overflow-hidden relative">
                <img
                    src={featureArticle.imageUrl || featureArticle.image || featureArticle.urlToImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=800&fit=crop'}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt={featureArticle.headline}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10"></div>
            </div>
        </div>

        {/* Standard Right Rail (300px) */}
        <div className="lg:pl-6 sticky top-24 self-start flex flex-col gap-6">
            {/* Static Newsletter Signup block */}
            <div className="border border-black p-6 bg-white text-center">
                <div className="mb-4">
                    <span className="text-2xl block mb-2">✉️</span>
                    <h4 className="font-bold text-lg mb-1" style={{ fontFamily: 'Georgia, serif' }}>Morning Pulse Direct</h4>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>Critical analysis delivered to your inbox daily.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <input
                        type="email"
                        placeholder="Your email address"
                        className="border-b border-gray-400 px-2 py-2 text-sm text-center focus:outline-none focus:border-black font-sans"
                    />
                    <button className="bg-black text-white font-bold uppercase text-[10px] tracking-widest py-3 hover:bg-gray-800 transition-colors mt-2">
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    </section>
);

export default ZoneD;
