import React, { useEffect, useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { 
  authenticateUser, 
  subscribeToPoll, 
  subscribeToUserPreferences 
} from './services/firebase';
import { PollData, UserPreferences } from './types';

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({ isPremium: false, alertKeywords: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authenticateUser();
        if (user) {
          setUserId(user.uid);
        } else {
          // Fallback to guest ID if auth fails or in mock mode
          console.log("Running in guest mode");
          setUserId(`guest-${Math.random().toString(36).substring(2, 9)}`);
        }
      } catch (e) {
        console.error("Auth init error:", e);
        setUserId(`guest-${Math.random().toString(36).substring(2, 9)}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // Poll Subscription
    const unsubscribePoll = subscribeToPoll((data) => {
      setPollData(data);
    });

    // User Prefs Subscription
    let unsubscribePrefs = () => {};
    if (userId) {
      unsubscribePrefs = subscribeToUserPreferences(userId, (prefs) => {
        setUserPrefs(prefs);
      });
    }

    return () => {
      unsubscribePoll();
      unsubscribePrefs();
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#D1D7DB] flex-col gap-4">
        <div className="w-16 h-16 border-4 border-whatsapp-light border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-semibold animate-pulse">Initializing Morning Pulse...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#D1D7DB]">
      {/* Mobile container simulation */}
      <div className="w-full h-full sm:h-[90vh] sm:w-[450px] bg-white sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-whatsapp-teal p-3 flex items-center justify-between text-white shadow-md z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <span className="text-xl">🌅</span>
             </div>
             <div>
                <h1 className="font-bold text-base leading-tight">Morning Pulse</h1>
                <p className="text-xs text-whatsapp-light/90">
                  {userPrefs.isPremium ? '✨ Premium Member' : 'AI News Bot'}
                </p>
             </div>
          </div>
          <div className="flex gap-4">
            <button className="opacity-80 hover:opacity-100">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
               </svg>
            </button>
            <button className="opacity-80 hover:opacity-100">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
               </svg>
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <ChatInterface 
          userId={userId} 
          pollData={pollData}
          userPrefs={userPrefs}
        />

      </div>
    </div>
  );
};

export default App;