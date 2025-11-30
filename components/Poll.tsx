import React, { useMemo } from 'react';
import { PollData } from '../types';
import { submitVote } from '../services/firebase';

interface PollProps {
  data: PollData;
  userId: string | null;
}

const Poll: React.FC<PollProps> = ({ data, userId }) => {
  const hasVoted = userId ? !!data.voters[userId] : false;
  const userChoice = userId ? data.voters[userId] : null;

  const sortedOptions = useMemo(() => {
    return Object.entries(data.options);
  }, [data.options]);

  const handleVote = (optionKey: string) => {
    if (!userId || hasVoted) return;
    submitVote(userId, optionKey);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-gray-800 text-sm">Poll</h3>
      </div>
      
      <p className="text-gray-900 text-base mb-3 leading-snug">
        {data.question}
      </p>

      <div className="space-y-2">
        {sortedOptions.map(([optionKey, count]) => {
          const percentage = data.totalVotes > 0 
            ? Math.round((count / data.totalVotes) * 100) 
            : 0;
          
          const isSelected = userChoice === optionKey;

          return (
            <button
              key={optionKey}
              onClick={() => handleVote(optionKey)}
              disabled={hasVoted}
              className={`w-full relative rounded-lg border flex flex-col justify-center min-h-[48px] px-3 transition-colors ${
                hasVoted 
                  ? 'cursor-default border-gray-200' 
                  : 'hover:bg-gray-50 border-gray-300 cursor-pointer active:bg-gray-100'
              } bg-white`}
            >
              {/* Background Progress Bar (WhatsApp style is usually subtle or just the count, but we keep the bar for better vis) */}
              {hasVoted && (
                <div 
                  className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-500 ease-out ${
                    isSelected ? 'bg-whatsapp-light/10' : 'bg-gray-100'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex w-full items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3 text-left">
                  {/* WhatsApp Style Circle Checkbox */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-whatsapp-teal bg-whatsapp-teal' : 'border-gray-400'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  
                  <span className={`text-sm leading-snug ${isSelected ? 'font-medium text-gray-900' : 'text-gray-800'}`}>
                    {optionKey}
                  </span>
                </div>
                
                {hasVoted && (
                   <div className="flex flex-col items-end flex-shrink-0">
                     <span className="text-xs font-medium text-gray-600">{count}</span>
                   </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {hasVoted && (
        <div className="mt-2 text-right">
             <span className="text-xs text-gray-500">{data.totalVotes} votes</span>
        </div>
      )}
    </div>
  );
};

export default Poll;