// Deployment fix attempt 2
import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, onAuthStateChanged } from 'firebase/auth';
import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import MobileSearch from './components/MobileSearch';
import MobileNotifications from './components/MobileNotifications';
import ForYouFeed from './components/ForYouFeed';
import AskPulseAI from './components/AskPulseAI';
import BookmarksPage from './components/BookmarksPage';

const AdminDashboardWrapper: React.FC<{ userRole: any }> = ({ userRole }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [userRole]);
  
  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        fontSize: '18px',
        color: '#666'
      }}>
        Initializing Dashboard...
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)' }}>
      <React.Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading Dashboard...
        </div>
      }>
        <AdminDashboard />
      </React.Suspense>
    </div>
  );
};
import NewsGrid from './components/NewsGrid';
import LoadingSkeleton from './components/LoadingSkeleton';
import FirebaseConnector from './components/FirebaseConnector';
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
import AdminLogin from './components/AdminLogin';
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import AboutPage from './components/AboutPage';
import SubscriptionPage from './components/SubscriptionPage';
import AdvertisePage from './components/AdvertisePage';
import EditorialPage from './components/EditorialPage';
import WriterRegistration from './components/WriterRegistration';
import WriterLogin from './components/WriterLogin';
import WriterDashboard from './components/WriterDashboard';
import SubscriberRegistration from './components/SubscriberRegistration';
import SubscriberLogin from './components/SubscriberLogin';
import SubscriberDashboard from './components/SubscriberDashboard';
import AdvertiserRegistration from './components/AdvertiserRegistration';
import AdvertiserLogin from './components/AdvertiserLogin';
import AdvertiserDashboard from './components/AdvertiserDashboard';
import AdSubmissionForm from './components/AdSubmissionForm';
import JoinPage from './components/JoinPage';
import AuthPage from './components/AuthPage';
import { 
  getCurrentEditor, 
  onEditorAuthStateChanged, 
  getUserRoles, // Use the new function
  requireEditor, // Keep this for role checking
  logoutEditor
} from './services/authService';
import { NewsStory } from '../types';
import { CountryInfo, getUserCountry, detectUserLocation, saveUserCountry, hasManualCountrySelection } from './services/locationService';
import { initAnalytics, trackPageView, trackArticleView } from './services/analyticsService';
import { setupScrollMemory, saveScrollPosition, restoreScrollPosition } from './utils/scrollMemory';


// ... (rest of the file is largely the same, applying the logic from the plan)

const App: React.FC = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]); // Correctly typed as string array
  const [adminAuthLoading, setAdminAuthLoading] = useState(true); // Start as true
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [currentPage, setCurrentPage] = useState<string>('news');

  useEffect(() => {
    const handleAuth = async () => {
        const unsubscribe = onEditorAuthStateChanged(async (user) => {
            if (user) {
                const roles = await getUserRoles();
                setUserRoles(roles);
                const hasAccess = await requireEditor();
                if (hasAccess) {
                    setView('admin');
                    window.location.hash = 'dashboard';
                } else {
                    setView('public');
                }
            } else {
                setUserRoles([]);
                setView('public');
            }
            setAdminAuthLoading(false);
        });
        return () => unsubscribe();
    };
    handleAuth();
  }, []);

  useEffect(() => {
    const handleHashChange = async () => {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('admin') || hash.startsWith('dashboard')) {
            if (!adminAuthLoading) {
                const hasAccess = await requireEditor();
                if (hasAccess) {
                    setCurrentPage('dashboard');
                } else {
                    setCurrentPage('admin');
                }
            }
        } else {
            // ... handle other routes
            setCurrentPage(hash || 'news');
        }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [adminAuthLoading]);
  
  // ... (rest of the rendering logic)

  return (
    <div className="app">
      {view === 'admin' ? (
        <>
          {/* Admin Dashboard Header */}
          <AdminDashboardWrapper userRole={userRoles} />
        </>
      ) : (
        <>
            {currentPage === 'admin' && <AdminLogin onLoginSuccess={() => setAdminAuthLoading(true)} />}
            {/* ... other public views */}
            {currentPage === 'news' && <NewsGrid newsData={{}} selectedCategory={null} userCountry={{code: 'ZW', name: 'Zimbabwe'}} />}
        </>
      )}
    </div>
  );
};

export default App;
