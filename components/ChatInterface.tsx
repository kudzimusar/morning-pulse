import React, { useState, useEffect, useRef } from 'react';
import { Message, PollData, UserPreferences } from '../types';
import { NEWS_DATA } from '../constants';
import { generateGeminiResponse } from '../services/geminiService';
import { 
  upgradeUserToPremium, 
  updateUserKeywords 
} from '../services/firebase';
import NewsFeed from './NewsFeed';
import Poll from './Poll';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  userId: string | null;
  pollData: PollData | null;
  userPrefs: UserPreferences;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId, pollData, userPrefs }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [botMode, setBotMode] = useState<'default' | 'alerts'>('default');

  // Initial Welcome Message
  useEffect(() => {
    setMessages([
      {
        id: 'init-1',
        sender: 'system',
        type: 'text',
        text: 'Today',
        timestamp: Date.now()
      },
      {
        id: 'init-2',
        sender: 'bot',
        type: 'news-feed',
        timestamp: Date.now()
      },
      {
        id: 'init-3',
        sender: 'bot',
        type: 'text',
        text: 'Tap a headline above to expand it, or type a question below to ask the AI.',
        timestamp: Date.now()
      },
      {
        id: 'init-4',
        sender: 'bot',
        type: 'poll',
        timestamp: Date.now()
      }
    ]);
  }, []);

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]); // Only scroll when message count changes, not on news expand

  const handleSendMessage = async () => {
    if (!input.trim() || !userId) return;

    const userText = input.trim();
    setInput('');

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      text: userText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // Command Handling
    if (userText.toLowerCase() === '*upgrade*') {
      await handleUpgrade();
      return;
    }

    if (userText.toLowerCase() === '*alerts*') {
      handleAlertsCommand();
      return;
    }

    if (botMode === 'alerts') {
      await handleAlertsInput(userText);
      return;
    }

    // Default AI Response
    setIsTyping(true);
    
    // Aggregate news headlines for context
    const headlines = Object.values(NEWS_DATA).flat().map(s => s.headline).join('\n');
    
    const response = await generateGeminiResponse(userText, headlines);
    
    setIsTyping(false);

    let htmlContent = response.text;
    if (response.sources.length > 0) {
        htmlContent += `\n\n**Sources:**\n${response.sources.map(s => `- [${s.title}](${s.uri})`).join('\n')}`;
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      type: 'text',
      text: htmlContent,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleUpgrade = async () => {
     setIsTyping(true);
     // Simulate network delay
     await new Promise(r => setTimeout(r, 1000));
     if (userId) {
       await upgradeUserToPremium(userId);
       const msg: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        type: 'text',
        text: '🎉 **Congratulations!** You are now a Premium subscriber. Try managing your keyword alerts by typing *alerts*.',
        timestamp: Date.now()
       };
       setMessages(prev => [...prev, msg]);
     }
     setIsTyping(false);
  };

  const handleAlertsCommand = () => {
      if (!userPrefs.isPremium) {
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: 'bot',
              type: 'text',
              text: '🔒 Keyword Alerts is a Premium feature.\nType *upgrade* to unlock.',
              timestamp: Date.now()
          }]);
          return;
      }

      setBotMode('alerts');
      const current = userPrefs.alertKeywords.length > 0 ? userPrefs.alertKeywords.join(', ') : 'None';
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          type: 'text',
          text: `🔔 **Alert Management**\nCurrent keywords: ${current}\n\nType "add [word]" or "remove [word]". Type "done" to exit.`,
          timestamp: Date.now()
      }]);
  };

  const handleAlertsInput = async (text: string) => {
      if (text.toLowerCase() === 'done') {
          setBotMode('default');
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            type: 'text',
            text: '✅ Alerts saved. Returning to chat.',
            timestamp: Date.now()
        }]);
        return;
      }

      const parts = text.split(' ');
      const command = parts[0].toLowerCase();
      const word = parts.slice(1).join(' ').toUpperCase();

      if ((command === 'add' || command === 'remove') && word && userId) {
          let newKeywords = [...userPrefs.alertKeywords];
          if (command === 'add' && !newKeywords.includes(word)) {
              newKeywords.push(word);
          } else if (command === 'remove') {
              newKeywords = newKeywords.filter(k => k !== word);
          }
          await updateUserKeywords(userId, newKeywords);
           setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            type: 'text',
            text: `Updated. Current: ${newKeywords.join(', ')}`,
            timestamp: Date.now()
        }]);
      } else {
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            type: 'text',
            text: 'Invalid format. Use "add [word]" or "remove [word]".',
            timestamp: Date.now()
        }]);
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#EFEAE2] relative">
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${msg.sender === 'system' ? 'justify-center' : ''}`}>
            
            {msg.sender === 'system' && (
               <span className="bg-[#E1F3FB] text-gray-600 text-xs py-1 px-3 rounded shadow-sm uppercase font-medium">
                   {msg.text}
               </span>
            )}

            {msg.sender !== 'system' && (
                <div 
                    className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-2 py-1 shadow-sm relative ${
                        msg.sender === 'user' 
                        ? 'bg-whatsapp-outgoing rounded-tr-none' 
                        : 'bg-white rounded-tl-none'
                    }`}
                >
                    {/* Render different message types */}
                    <div className="p-1">
                        {msg.type === 'text' && (
                             <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                <ReactMarkdown 
                                    components={{
                                        a: ({node, ...props}) => <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" />
                                    }}
                                >
                                    {msg.text || ''}
                                </ReactMarkdown>
                             </div>
                        )}
                        
                        {msg.type === 'news-feed' && <NewsFeed />}
                        
                        {msg.type === 'poll' && pollData && <Poll data={pollData} userId={userId} />}
                    </div>

                    {/* Timestamp */}
                    <div className="flex justify-end mt-1 space-x-1 items-center">
                        <span className="text-[10px] text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {msg.sender === 'user' && (
                             <span className="text-blue-400 text-[10px]">✓✓</span>
                        )}
                    </div>
                </div>
            )}
          </div>
        ))}
        
        {isTyping && (
             <div className="flex justify-start">
                 <div className="bg-white rounded-lg rounded-tl-none px-4 py-2 shadow-sm">
                     <div className="flex space-x-1">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] p-2 flex items-center gap-2">
        <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={botMode === 'alerts' ? "Type 'add [keyword]'..." : "Ask a question..."}
            className="flex-1 py-2 px-4 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-whatsapp-teal text-sm"
        />
        <button 
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="p-3 bg-whatsapp-teal text-white rounded-full hover:bg-[#006e5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
            </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
