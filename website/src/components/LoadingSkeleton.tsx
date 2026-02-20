import React from 'react';
import MobileSkeleton from './MobileSkeleton';

/**
 * LoadingSkeleton Component
 * Displays skeleton loaders while content is being fetched
 * Uses MobileSkeleton on mobile devices
 */

const LoadingSkeleton: React.FC = () => {
  return (
    <>
      {/* Mobile Skeleton - Shown on Mobile */}
      <div className="mobile-only">
        <MobileSkeleton variant="hero" count={1} />
        <MobileSkeleton variant="list" count={5} />
      </div>

      {/* Desktop Skeleton - Shown on Desktop */}
      <div className="hidden lg:block max-w-[1200px] mx-auto px-4 mt-8 mb-16">
        <div className="grid grid-cols-[220px_640px_300px] gap-6 items-start">

          {/* Left Rail Skeleton (4 items) */}
          <div className="flex flex-col gap-4 pr-6 border-r border-gray-200">
            {[1, 2, 3, 4].map(i => (
              <div key={`left-${i}`} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="w-12 h-2 bg-gray-200 mb-3 animate-pulse"></div>
                <div className="w-full h-4 bg-gray-200 mb-2 animate-pulse"></div>
                <div className="w-4/5 h-4 bg-gray-200 mb-3 animate-pulse"></div>
                <div className="w-full h-2 bg-gray-200 mb-1 animate-pulse delay-75"></div>
                <div className="w-5/6 h-2 bg-gray-200 mb-1 animate-pulse delay-75"></div>
                <div className="w-2/3 h-2 bg-gray-200 animate-pulse delay-75"></div>
              </div>
            ))}
          </div>

          {/* Center Stage Skeleton (Hero) */}
          <div className="px-6 border-r border-gray-200 flex flex-col">
            <div className="w-full aspect-video bg-gray-200 mb-4 animate-pulse"></div>
            <div className="w-full h-8 bg-gray-200 mb-3 animate-pulse delay-75"></div>
            <div className="w-3/4 h-8 bg-gray-200 mb-4 animate-pulse delay-75"></div>
            <div className="w-full h-4 bg-gray-200 mb-2 animate-pulse delay-100"></div>
            <div className="w-full h-4 bg-gray-200 mb-2 animate-pulse delay-100"></div>
            <div className="w-5/6 h-4 bg-gray-200 animate-pulse delay-100"></div>
          </div>

          {/* Right Rail Skeleton (Opinions) */}
          <div className="pl-6 flex flex-col gap-6">
            <div className="w-32 h-2 bg-gray-200 mb-2 animate-pulse"></div>
            {[1, 2, 3].map(i => (
              <div key={`right-${i}`} className="flex gap-4 items-start border-b border-gray-200 pb-5 last:border-0">
                <div className="flex-1">
                  <div className="w-16 h-2 bg-gray-200 mb-2 animate-pulse"></div>
                  <div className="w-full h-4 bg-gray-200 mb-1 animate-pulse delay-75"></div>
                  <div className="w-4/5 h-4 bg-gray-200 animate-pulse delay-75"></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 animate-pulse delay-100"></div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default LoadingSkeleton;
