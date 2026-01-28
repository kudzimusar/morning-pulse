/**
 * Admin Dashboard - Complete Editorial Control Center
 * Full-featured dashboard with tabbed navigation and priority summary
 */

import React, { useEffect, useState } from 'react';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Opinion } from '../../types';
import PrioritySummary from './admin/PrioritySummary';
import EditorialQueueTab from './admin/EditorialQueueTab';
import PublishedContentTab from './admin/PublishedContentTab';
import StaffManagementTab from './admin/StaffManagementTab';
import AnalyticsTab from './admin/AnalyticsTab';
import NewsletterTab from './admin/NewsletterTab';
import NewsletterAnalyticsTab from './admin/NewsletterAnalyticsTab';
import SubscriberTab from './admin/SubscriberTab';
import ImageComplianceTab from './admin/ImageComplianceTab';
import SettingsTab from './admin/SettingsTab';
import WriterManagementTab from './admin/WriterManagementTab';
import SubscriberManagementTab from './admin/SubscriberManagementTab';
import AdManagementTab from './admin/AdManagementTab';
import IntegrationSettings from './admin/IntegrationSettings';
import { updateLastActive } from '../services/staffService';

// Constants
const APP_ID = "morning-pulse-app";

// Get Firebase instances (reuse existing app)
const getFirebaseInstances = () => {
  try {
    const app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { auth, db };
  } catch (error) {
    // console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

interface StaffDocument {
  email: string;
  name: string;
  roles: string[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

type TabId = 'dashboard' | 'editorial-queue' | 'published-content' | 'staff-management' | 'writer-management' | 'subscriber-management' | 'ad-management' | 'analytics' | 'newsletter' | 'newsletter-analytics' | 'subscribers' | 'image-compliance' | 'settings' | 'integrations';

// ✅ FIX: Move tabs array to top level to prevent initialization errors
const ALL_TABS = [
  { id: 'dashboard' as TabId, label: 'Dashboard Overview', icon: '📊' },
  { id: 'editorial-queue' as TabId, label: 'Editorial Queue', icon: '📝' },
  { id: 'published-content' as TabId, label: 'Published Content', icon: '✅' },
  { id: 'staff-management' as TabId, label: 'Staff Management', icon: '👥', adminOnly: true },
  { id: 'writer-management' as TabId, label: 'Writer Management', icon: '✍️', adminOnly: true },
  { id: 'subscriber-management' as TabId, label: 'Subscriber Management', icon: '👤', adminOnly: true },
  { id: 'ad-management' as TabId, label: 'Ad Management', icon: '📢', adminOnly: true },
  { id: 'analytics' as TabId, label: 'Analytics', icon: '📈', superAdminOnly: true },
  { id: 'newsletter' as TabId, label: 'Newsletter Generator', icon: '📧', superAdminOnly: true },
  { id: 'newsletter-analytics' as TabId, label: 'Newsletter History', icon: '📊', superAdminOnly: true },
  { id: 'image-compliance' as TabId, label: 'Image Compliance', icon: '🖼️', superAdminOnly: true },
  { id: 'integrations' as TabId, label: 'Integrations', icon: '🔌', adminOnly: true },
  { id: 'subscribers' as TabId, label: 'Subscribers', icon: '👥' },
  { id: 'settings' as TabId, label: 'Settings', icon: '⚙️' },
];

const AdminDashboard: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [publishedOpinions, setPublishedOpinions] = useState<Opinion[]>([]);
  
  // UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Firebase instances
  const [firebaseInstances, setFirebaseInstances] = useState<{
    auth: any;
    db: Firestore;
  } | null>(null);

  // Initialize Firebase instances
  useEffect(() => {
    try {
      const instances = getFirebaseInstances();
      setFirebaseInstances(instances);
      console.log('✅ Initialization: Firebase instances ready');
    } catch (error) {
      // console.error('Failed to get Firebase instances:', error);
      setLoading(false);
    }
  }, []);

  // Handle URL params
  useEffect(() => {
    if (!firebaseInstances) return;
    
    const parseHashParams = () => {
      try {
        const hash = window.location.hash;
        const hashMatch = hash.match(/#([^?]+)(\?.+)?/);
        if (hashMatch) {
          const path = hashMatch[1];
          const queryString = hashMatch[2] || '';
          
          if (queryString) {
            const params = new URLSearchParams(queryString.substring(1));
            const tabParam = params.get('tab') as TabId;
            const articleParam = params.get('article');
            
            if (tabParam && ['editorial-queue', 'published-content'].includes(tabParam)) {
              setActiveTab(tabParam);
            }
            
            if (articleParam && tabParam === 'editorial-queue') {
              if (!hash.includes(`article=${articleParam}`)) {
                const newHash = `#dashboard?tab=editorial-queue&article=${articleParam}`;
                window.history.replaceState(null, '', newHash);
              }
            }
          }
        }
      } catch (error) {
        // console.error('Error parsing hash params:', error);
      }
    };
    
    parseHashParams();
    window.addEventListener('hashchange', parseHashParams);
    return () => window.removeEventListener('hashchange', parseHashParams);
  }, [firebaseInstances]);

  // Auth state listener
  useEffect(() => {
    if (!firebaseInstances) return;

    const { auth } = firebaseInstances;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 🚀 EMERGENCY BOOTSTRAP: Restore admin access for specific UID
        const BOOTSTRAP_UID = '2jnMK761RcMvag3Agj5Wx3HjwpJ2';
        const VAGWARISA_UID = 'VaGwarisa'; // Business partner UID
        
        if (currentUser.uid === BOOTSTRAP_UID || currentUser.uid === VAGWARISA_UID) {
          try {
            const { db } = firebaseInstances;
            const staffRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'staff', currentUser.uid);
            const staffSnap = await getDoc(staffRef);
            
            if (!staffSnap.exists()) {
              await setDoc(staffRef, {
                email: currentUser.email,
                roles: ['super_admin', 'editor', 'admin'],
                status: 'active',
                uid: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              console.log('✅ Initialization: Admin account bootstrapped');
            }
          } catch (bootstrapError) {
            // console.error('❌ Bootstrap failed:', bootstrapError);
          }
        }

        try {
          const { db } = firebaseInstances;
          const staffRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'staff', currentUser.uid);
          const staffSnap = await getDoc(staffRef);
          
          if (staffSnap.exists()) {
            const staffData = staffSnap.data() as StaffDocument;
            const roles = staffData.roles || [];
            setUserRoles(roles);
            setIsAuthorized(roles.includes('editor') || roles.includes('admin') || roles.includes('super_admin'));
            setIsAdmin(roles.includes('admin') || roles.includes('super_admin'));
            setIsSuperAdmin(roles.includes('super_admin'));
            console.log('✅ Initialization: User roles verified');
          } else {
            setUserRoles([]);
            setIsAuthorized(false);
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        } catch (error) {
          // console.error('Error checking staff role:', error);
          setUserRoles([]);
          setIsAuthorized(false);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } else {
        setUserRoles([]);
        setIsAuthorized(false);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseInstances]);

  // Activity heartbeat
  useEffect(() => {
    if (!user || !isAuthorized) return;
    updateLastActive(user.uid).catch(() => {});
    const intervalId = setInterval(() => {
      updateLastActive(user.uid).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [user, isAuthorized]);

  // Subscribe to opinions
  useEffect(() => {
    if (!isAuthorized || !firebaseInstances) return;

    const { db } = firebaseInstances;
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
    const q = query(opinionsRef);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions: Opinion[] = [];
        snapshot.forEach((docSnap) => {
          opinions.push({ id: docSnap.id, ...docSnap.data() } as Opinion);
        });
        
        setPendingOpinions(opinions.filter(o => o.status === 'pending'));
        setPublishedOpinions(opinions.filter(o => o.status === 'published' || o.isPublished));
      },
      (error) => {
        // console.error('Error listening to opinions:', error);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized, firebaseInstances]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseInstances) return;
    
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const { auth } = firebaseInstances;
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Initialization: Login successful');
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!firebaseInstances) return;
    try {
      await signOut(firebaseInstances.auth);
      setActiveTab('dashboard');
    } catch (error) {
      // console.error('Logout error:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Initializing Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>Editorial Login</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required />
            </div>
            {loginError && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>{loginError}</p>}
            <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: loginLoading ? 'not-allowed' : 'pointer' }}>
              {loginLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626' }}>Access Denied</h2>
          <p style={{ marginBottom: '24px' }}>You are not an authorized editor.</p>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
    );
  }

  // Filter tabs based on roles
  const tabs = ALL_TABS.filter(tab => {
    if (tab.superAdminOnly) return isSuperAdmin;
    if (tab.adminOnly) return isAdmin;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ padding: '12px 20px', backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', fontSize: '0.875rem', fontWeight: '500', minWidth: '200px' }}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ backgroundColor: '#000', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #fff' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Editorial Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>{user.email} {isSuperAdmin ? '(Super Admin)' : isAdmin ? '(Admin)' : '(Editor)'}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Logout</button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '240px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <nav style={{ padding: '16px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  textAlign: 'left',
                  backgroundColor: activeTab === tab.id ? '#000' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#fff' }}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>Dashboard Overview</h2>
              <PrioritySummary
                pendingCount={pendingOpinions.length}
                imageIssuesCount={0}
                scheduledCount={0}
                recentlyPublishedCount={publishedOpinions.length}
                onNavigate={(tab) => setActiveTab(tab as TabId)}
              />
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginTop: '24px' }}>
                <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: '600' }}>Today's Activity</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>Recent editorial actions and system updates will appear here.</p>
              </div>
            </div>
          )}

          {activeTab === 'editorial-queue' && (
            <EditorialQueueTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
          )}

          {activeTab === 'published-content' && (
            <PublishedContentTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
          )}

          {activeTab === 'staff-management' && isAdmin && (
            <StaffManagementTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
          )}

          {activeTab === 'writer-management' && isAdmin && (
            <WriterManagementTab userRoles={userRoles} />
          )}

          {activeTab === 'subscriber-management' && isAdmin && (
            <SubscriberManagementTab userRoles={userRoles} />
          )}

          {activeTab === 'ad-management' && isAdmin && (
            <AdManagementTab userRoles={userRoles} />
          )}

          {activeTab === 'analytics' && isAuthorized && (
            <AnalyticsTab firebaseInstances={firebaseInstances} isAuthorized={isAuthorized} userRoles={userRoles} />
          )}

          {activeTab === 'newsletter' && (
            <NewsletterTab />
          )}

          {activeTab === 'newsletter-analytics' && isSuperAdmin && (
            <NewsletterAnalyticsTab />
          )}

          {activeTab === 'subscribers' && (
            <SubscriberTab />
          )}

          {activeTab === 'image-compliance' && (
            <ImageComplianceTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
          )}

          {activeTab === 'integrations' && isAdmin && (
            <IntegrationSettings userRoles={userRoles} showToast={showToast} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
