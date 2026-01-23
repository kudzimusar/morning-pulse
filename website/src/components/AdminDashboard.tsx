/**
 * Admin Dashboard - Complete Editorial Control Center
 * Full-featured dashboard with tabbed navigation and priority summary
 */

import React, { useEffect, useState } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
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
    console.error('Firebase initialization error:', error);
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

type TabId = 'dashboard' | 'editorial-queue' | 'published-content' | 'staff-management' | 'writer-management' | 'subscriber-management' | 'ad-management' | 'analytics' | 'newsletter' | 'subscribers' | 'image-compliance' | 'settings' | 'integrations';

const AdminDashboard: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [allOpinions, setAllOpinions] = useState<Opinion[]>([]);
  
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
    } catch (error) {
      console.error('Failed to get Firebase instances:', error);
      setLoading(false);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    if (!firebaseInstances) return;

    const { auth } = firebaseInstances;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 🚀 EMERGENCY BOOTSTRAP: Restore admin access for specific UID
        const BOOTSTRAP_UID = '2jnMK761RcMvag3Agj5Wx3HjwpJ2';
        if (currentUser.uid === BOOTSTRAP_UID) {
          try {
            const { db } = firebaseInstances;
            const staffRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'staff', BOOTSTRAP_UID);
            const staffSnap = await getDoc(staffRef);
            
            if (!staffSnap.exists()) {
              console.log('🛠️ Bootstrapping admin account for UID:', BOOTSTRAP_UID);
              await setDoc(staffRef, {
                email: currentUser.email,
                roles: ['super_admin', 'editor'],
                status: 'active',
                uid: BOOTSTRAP_UID,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              showToast('Admin account bootstrapped successfully', 'success');
            }
          } catch (bootstrapError) {
            console.error('❌ Bootstrap failed:', bootstrapError);
          }
        }

        // Check staff document at root level: /staff/{uid}
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
          } else {
            setUserRoles([]);
            setIsAuthorized(false);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking staff role:', error);
          setUserRoles([]);
          setIsAuthorized(false);
          setIsAdmin(false);
        }
      } else {
        setUserRoles([]);
        setIsAuthorized(false);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseInstances]);

  // Activity heartbeat - update lastActive every 5 minutes
  useEffect(() => {
    if (!user || !isAuthorized) return;

    // Update immediately on mount
    updateLastActive(user.uid).catch(err => 
      console.warn('Could not update lastActive:', err)
    );

    // Then update every 5 minutes
    const intervalId = setInterval(() => {
      updateLastActive(user.uid).catch(err => 
        console.warn('Could not update lastActive:', err)
      );
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [user, isAuthorized]);

  // Subscribe to all opinions for priority summary
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
          const data = docSnap.data();
          opinions.push({
            id: docSnap.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            publishedAt: data.publishedAt?.toDate?.() || null,
          } as Opinion);
        });
        
        setAllOpinions(opinions || []);
        setPendingOpinions((opinions || []).filter(op => op.status === 'pending'));
        setPublishedOpinions((opinions || []).filter(op => op.status === 'published'));
      },
      (error) => {
        console.error('❌ Firestore Permission Error (Opinions):', error);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized, firebaseInstances]);

  // Toast notifications
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!firebaseInstances) {
      setLoginError('Firebase not initialized');
      setLoginLoading(false);
      return;
    }

    try {
      const { auth } = firebaseInstances;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Failed to sign in');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (!firebaseInstances) return;
    
    try {
      const { auth } = firebaseInstances;
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed', 'error');
    }
  };

  // Calculate priority metrics
  const imageIssuesCount = (pendingOpinions || []).filter(op => 
    !op.finalImageUrl && !op.suggestedImageUrl && !op.imageUrl
  ).length;
  
  const scheduledCount = 0; // TODO: Implement scheduled publishing
  const recentlyPublishedCount = (publishedOpinions || []).filter(op => {
    if (!op.publishedAt) return false;
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return op.publishedAt > dayAgo;
  }).length;

  // Loading state
  if (loading || !firebaseInstances) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#fff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Not authenticated - show login form
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
            Editor Login
          </h2>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            {loginError && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: loginLoading ? '#999' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: loginLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated but not authorized
  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#fff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            Access Denied
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            You are not an authorized editor.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Authorized - show dashboard
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Dashboard Overview', icon: '📊' },
    { id: 'editorial-queue' as TabId, label: 'Editorial Queue', icon: '📝' },
    { id: 'published-content' as TabId, label: 'Published Content', icon: '✅' },
    { id: 'staff-management' as TabId, label: 'Staff Management', icon: '👥', adminOnly: true },
    { id: 'writer-management' as TabId, label: 'Writer Management', icon: '✍️', adminOnly: true },
    { id: 'subscriber-management' as TabId, label: 'Subscriber Management', icon: '👤', adminOnly: true },
    { id: 'ad-management' as TabId, label: 'Ad Management', icon: '📢', adminOnly: true },
    { id: 'analytics' as TabId, label: 'Analytics', icon: '📈' },
    { id: 'newsletter' as TabId, label: 'Newsletter Generator', icon: '📧' },
    { id: 'subscribers' as TabId, label: 'Subscribers', icon: '👥' },
    { id: 'image-compliance' as TabId, label: 'Image Compliance', icon: '🖼️' },
    { id: 'integrations' as TabId, label: 'Integrations', icon: '🔌', adminOnly: true },
    { id: 'settings' as TabId, label: 'Settings', icon: '⚙️' },
  ].filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#fff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '12px 20px',
              backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: '0.875rem',
              fontWeight: '500',
              minWidth: '200px'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #fff'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Editorial Dashboard
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Layout */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Sidebar Navigation */}
        <div style={{
          width: '240px',
          backgroundColor: '#f9fafb',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
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
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#fff'
        }}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
                Dashboard Overview
              </h2>
              <PrioritySummary
                pendingCount={pendingOpinions.length}
                imageIssuesCount={imageIssuesCount}
                scheduledCount={scheduledCount}
                recentlyPublishedCount={recentlyPublishedCount}
                onNavigate={(tab) => setActiveTab(tab as TabId)}
              />
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px',
                marginTop: '24px'
              }}>
                <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: '600' }}>
                  Today's Activity
                </h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Recent editorial actions and system updates will appear here.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'editorial-queue' && (
            <EditorialQueueTab
              firebaseInstances={firebaseInstances}
              userRoles={userRoles}
              showToast={showToast}
            />
          )}

          {activeTab === 'published-content' && (
            <PublishedContentTab
              firebaseInstances={firebaseInstances}
              userRoles={userRoles}
              showToast={showToast}
            />
          )}

          {activeTab === 'staff-management' && isAdmin && (
            <StaffManagementTab
              firebaseInstances={firebaseInstances}
              userRoles={userRoles}
              showToast={showToast}
            />
          )}

          {activeTab === 'writer-management' && isAdmin && (
            <WriterManagementTab
              userRoles={userRoles}
            />
          )}

          {activeTab === 'subscriber-management' && isAdmin && (
            <SubscriberManagementTab
              userRoles={userRoles}
            />
          )}

          {activeTab === 'ad-management' && isAdmin && (
            <AdManagementTab
              userRoles={userRoles}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              firebaseInstances={firebaseInstances}
            />
          )}

          {activeTab === 'newsletter' && (
            <NewsletterTab />
          )}

          {activeTab === 'subscribers' && (
            <SubscriberTab />
          )}

          {activeTab === 'image-compliance' && (
            <ImageComplianceTab
              firebaseInstances={firebaseInstances}
              userRoles={userRoles}
              showToast={showToast}
            />
          )}

          {activeTab === 'integrations' && isAdmin && (
            <IntegrationSettings
              userRoles={userRoles}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              firebaseInstances={firebaseInstances}
              userRoles={userRoles}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
