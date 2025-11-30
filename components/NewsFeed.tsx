import React, { useState, useCallback } from 'react';
import { NEWS_DATA } from '../constants';

const NewsFeed: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  return (
    <div className="w-full space-y-4">
      {Object.entries(NEWS_DATA).map(([category, stories]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-bold text-whatsapp-teal uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {stories.map((story) => {
              const isExpanded = expandedId === story.id;
              
              return (
                <div key={story.id} className="transition-all duration-300 ease-in-out">
                  {isExpanded ? (
                    // Expanded View
                    <div className="bg-white rounded-lg shadow-sm border-l-4 border-whatsapp-teal p-3 animate-fadeIn">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-whatsapp-teal uppercase">News Detail</div>
                        <h4 className="font-bold text-gray-900 leading-tight">{story.headline}</h4>
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{story.detail}</p>
                        <div className="flex justify-between items-center mt-3 border-t pt-2">
                          <span className="text-xs text-gray-500 italic">Source: {story.source}</span>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(story.id);
                            }}
                            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Collapsed View (Button)
                    <button
                      onClick={() => handleToggle(story.id)}
                      className="w-full text-left bg-white hover:bg-gray-50 active:bg-gray-100 p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col transition-colors"
                    >
                      <span className="font-semibold text-sm text-gray-800 leading-snug">
                        {story.headline}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {story.source}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;
