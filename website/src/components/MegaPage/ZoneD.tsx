import { NewsStory } from '../../types';
import MorningBriefCard from '../MorningBriefCard';

interface ZoneDProps {
    featureArticle: NewsStory;
}

// Helper to fix screaming caps (all-uppercase headlines)
const formatText = (text?: string) => {
    if (!text) return '';
    if (text === text.toUpperCase() && text.length > 5) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    return text;
};

const ZoneD: React.FC<ZoneDProps> = ({ featureArticle }) => (
    <section className="zone-grid-merge-left mb-16 px-4 lg:px-0">

        {/* Merged Left+Center (884px) */}
        <a href={featureArticle.url || '#'} target="_blank" rel="noopener noreferrer" className="block bg-gray-50 border-y border-gray-200 p-8 flex flex-col md:flex-row gap-8 items-center lg:editorial-border-right lg:pr-10 group cursor-pointer focus:outline-none">
            <div className="md:w-1/3">
                <span className="font-sans text-[10px] font-bold uppercase text-[#326891] mb-2 block tracking-widest">Feature</span>
                <h2 className="text-3xl font-bold mb-4 leading-tight group-hover:text-gray-600 transition-colors break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
                    {formatText(featureArticle.headline || featureArticle.title)}
                </h2>
                <p className="text-base text-gray-700 leading-relaxed mb-4 line-clamp-4 break-words hyphens-auto" style={{ fontFamily: 'Georgia, serif' }}>
                    {formatText(featureArticle.summary || featureArticle.detail)}
                </p>
                <span className="text-[10px] font-bold uppercase text-gray-400 font-sans tracking-wide">
                    By {featureArticle.source || 'Morning Pulse'}
                </span>
            </div>

            {/* 16:9 Image filling the rest of the merged space */}
            <div className="md:w-2/3 w-full aspect-video bg-gray-200 overflow-hidden relative">
                <img
                    src={featureArticle.imageUrl || featureArticle.image || featureArticle.urlToImage || ''}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt={featureArticle.headline}
                    loading="lazy"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10"></div>
            </div>
        </a>

        {/* Standard Right Rail (300px) */}
        <div className="lg:pl-6 sticky top-24 self-start flex flex-col gap-6 w-full max-w-[300px]">
            {/* Direct Newsletter Signup Integration */}
            <MorningBriefCard variant="column" />
        </div>
    </section>
);

export default ZoneD;
