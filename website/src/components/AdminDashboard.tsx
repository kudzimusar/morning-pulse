/**
 * Admin Dashboard - Complete Editorial Control Center
 * Full-featured dashboard with tabbed navigation and priority summary
 */

import React, { useEffect, useState } from 'react';
import {
  signOut,
  User,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Opinion } from '../types';
// Lazy load tab components
const PrioritySummary = React.lazy(() => import('./admin/PrioritySummary'));
const EditorialQueueTab = React.lazy(() => import('./admin/EditorialQueueTab'));
const PublishedContentTab = React.lazy(() => import('./admin/PublishedContentTab'));
const StaffManagementTab = React.lazy(() => import('./admin/StaffManagementTab'));
const AnalyticsTab = React.lazy(() => import('./admin/AnalyticsTab'));
const NewsletterHub = React.lazy(() => import('./admin/NewsletterHub'));
const ImageComplianceTab = React.lazy(() => import('./admin/ImageComplianceTab'));
const SettingsTab = React.lazy(() => import('./admin/SettingsTab'));
const SubscriberManagementTab = React.lazy(() => import('./admin/SubscriberManagementTab'));
const AdManagementTab = React.lazy(() => import('./admin/AdManagementTab'));
const IntegrationSettings = React.lazy(() => import('./admin/IntegrationSettings'));
const WriterHub = React.lazy(() => import('./admin/WriterHub'));
const DashboardOverviewTab = React.lazy(() => import('./admin/DashboardOverviewTab'));
const RevenueTab = React.lazy(() => import('./admin/RevenueTab'));
const SystemTab = React.lazy(() => import('./admin/SystemTab'));
const QuickActionsFab = React.lazy(() => import('./admin/QuickActionsFab'));
import { updateLastActive } from '../services/staffService';
import './admin/AdminDashboard.css';
import { Suspense } from 'react';
// Constants
const APP_ID = "morning-pulse-app";

// Get Firebase instances (reuse existing app)
const getFirebaseInstances = () => ({ auth, db });

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

type TabId = 'dashboard' | 'editorial-queue' | 'published-content' | 'staff-management' | 'writer-hub' | 'subscriber-management' | 'ad-management' | 'analytics' | 'revenue' | 'system-health' | 'newsletter-hub' | 'image-compliance' | 'settings' | 'integrations';

const ALL_TABS = [
  { id: 'dashboard' as TabId, label: 'Command Center', icon: '🏰' },
  { id: 'editorial-queue' as TabId, label: 'Editorial Queue', icon: '📝' },
  { id: 'published-content' as TabId, label: 'Published Content', icon: '✅' },
  { id: 'staff-management' as TabId, label: 'Staff Management', icon: '👥', adminOnly: true },
  { id: 'writer-hub' as TabId, label: 'Writer Management', icon: '✍️', adminOnly: true },
  { id: 'subscriber-management' as TabId, label: 'Subscriber Management', icon: '👤', adminOnly: true },
  { id: 'ad-management' as TabId, label: 'Ad Management', icon: '📢', adminOnly: true },
  { id: 'revenue' as TabId, label: 'Revenue Dashboard', icon: '💰', superAdminOnly: true },
  { id: 'analytics' as TabId, label: 'Analytics Hub', icon: '📈', superAdminOnly: true },
  { id: 'system-health' as TabId, label: 'System Health', icon: '⚡', superAdminOnly: true },
  { id: 'newsletter-hub' as TabId, label: 'Newsletter Hub', icon: '📧', superAdminOnly: true },
  { id: 'image-compliance' as TabId, label: 'Image Compliance', icon: '🖼️', superAdminOnly: true },
  { id: 'integrations' as TabId, label: 'Integrations', icon: '🔌', adminOnly: true },
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
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Notifications (system + pending review)
  const notifications = React.useMemo(() => {
    const list: { id: string; type: string; title: string; message: string; time: string }[] = [];
    if (pendingOpinions.length > 0) {
      list.push({
        id: 'pending-review',
        type: 'info',
        title: 'Pending review',
        message: `${pendingOpinions.length} item${pendingOpinions.length === 1 ? '' : 's'} need review`,
        time: 'Just now',
      });
    }
    list.push({ id: 'system', type: 'success', title: 'System', message: 'All systems operational', time: 'Just now' });
    return list;
  }, [pendingOpinions.length]);

  // Keyboard shortcuts: Cmd/Ctrl+K (search), Cmd/Ctrl+N (new article), Cmd/Ctrl+/ (help), 1-9 (tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setSearchOpen(false);
        setNotificationPanelOpen(false);
        return;
      }

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!searchOpen) setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (!isInputFocused) {
          setActiveTab('editorial-queue');
          showToast('Switched to Editorial Queue', 'success');
        }
        return;
      }
      if (mod && e.key === '/') {
        e.preventDefault();
        if (!isInputFocused) setShowShortcutsModal(true);
        return;
      }

      if (!isInputFocused) {
        const key = e.key;
        if (key >= '1' && key <= '9') {
          const index = parseInt(key) - 1;
          if (ALL_TABS[index]) {
            setActiveTab(ALL_TABS[index].id);
            showToast(`Switched to ${ALL_TABS[index].label}`, 'success');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Focus search input when search overlay opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

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
          // Immediately authorize bootstrap UIDs
          setIsAuthorized(true);
          setIsAdmin(true);
          setIsSuperAdmin(true);

          try {
            const { db } = firebaseInstances;
            const staffRef = doc(db, 'staff', currentUser.uid);
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
          const staffRef = doc(db, 'staff', currentUser.uid);
          const staffSnap = await getDoc(staffRef);

          if (staffSnap.exists()) {
            const staffData = staffSnap.data() as StaffDocument;
            const roles = staffData.roles || [];
            setUserRoles(roles);
            setIsAuthorized(roles.includes('editor') || roles.includes('admin') || roles.includes('super_admin'));
            setIsAdmin(roles.includes('admin') || roles.includes('super_admin'));
            setIsSuperAdmin(roles.includes('super_admin'));
            console.log('✅ Initialization: User roles verified');
          } else if (currentUser.uid === BOOTSTRAP_UID || currentUser.uid === VAGWARISA_UID) {
            // ✅ FIX: Don't unauthorized bootstrap users even if doc doesn't exist yet
            console.log('🚀 [AUTH] Keeping bootstrap user authorized');
            setUserRoles(['super_admin', 'admin', 'editor']);
            setIsAuthorized(true);
            setIsAdmin(true);
            setIsSuperAdmin(true);
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
    updateLastActive(user.uid).catch(() => { });
    const intervalId = setInterval(() => {
      updateLastActive(user.uid).catch(() => { });
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

  const handleShortcutAction = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchOpen(false);
    showToast(`Switched to ${ALL_TABS.find(t => t.id === tabId)?.label || tabId}`, 'success');
  };

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
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            style={{ padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            title="Search / Quick switch (⌘K)"
          >
            Search ⌘K
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setNotificationPanelOpen((o) => !o)}
              style={{ padding: '8px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', position: 'relative' }}
              title="Notifications"
              aria-label="Notifications"
            >
              <span style={{ fontSize: '20px' }}>🔔</span>
              {pendingOpinions.length > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', minWidth: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingOpinions.length}</span>
              )}
            </button>
            {notificationPanelOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setNotificationPanelOpen(false)} aria-hidden="true" />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#fff', color: '#111', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, padding: '8px 0' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '14px' }}>Notifications</div>
                  {notifications.map((n) => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                      <div style={{ fontWeight: '600', color: '#111' }}>{n.title}</div>
                      <div style={{ color: '#6b7280', marginTop: '4px' }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
          <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Processing...</div>}>
            {activeTab === 'dashboard' && (
              <DashboardOverviewTab
                onNavigate={(tab) => setActiveTab(tab as any)}
                pendingCount={pendingOpinions.length}
                publishedCount={publishedOpinions.length}
              />
            )}

            {activeTab === 'editorial-queue' && (
              <EditorialQueueTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
            )}

            {activeTab === 'published-content' && (
              <PublishedContentTab firebaseInstances={firebaseInstances} userRoles={userRoles} showToast={showToast} />
            )}

            {activeTab === 'staff-management' && isAdmin && (
              <StaffManagementTab />
            )}

            {activeTab === 'writer-hub' && isAdmin && (
              <WriterHub userRoles={userRoles} />
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

            {activeTab === 'revenue' && isSuperAdmin && (
              <RevenueTab />
            )}

            {activeTab === 'system-health' && isSuperAdmin && (
              <SystemTab firebaseInstances={firebaseInstances} onNavigateToTab={(tab) => setActiveTab(tab as TabId)} />
            )}

            {activeTab === 'newsletter-hub' && isSuperAdmin && (
              <NewsletterHub />
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
          </Suspense>
        </div>
      </div>

      {/* Quick Actions FAB */}
      <Suspense fallback={null}>
        <QuickActionsFab
          onNewArticle={() => setActiveTab('editorial-queue')}
          onInviteStaff={() => setActiveTab('staff-management')}
          onGenerateReport={() => setActiveTab('analytics')}
          onNotifications={() => setNotificationPanelOpen(true)}
        />
      </Suspense>

      {/* Search overlay (⌘K) */}
      {searchOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10001 }} onClick={() => setSearchOpen(false)} aria-hidden="true" />
          <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 'min(420px, 90vw)', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', zIndex: 10002, padding: '16px', overflow: 'hidden' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tabs..."
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}
            />
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleShortcutAction(tab.id)}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: activeTab === tab.id ? '#f3f4f6' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Shortcuts help modal (⌘/) */}
      {showShortcutsModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10001 }} onClick={() => setShowShortcutsModal(false)} aria-hidden="true" />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(360px, 90vw)', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', zIndex: 10002, padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Keyboard shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Search / Quick switch</span><kbd style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px' }}>⌘K</kbd></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>New article</span><kbd style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px' }}>⌘N</kbd></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Show shortcuts</span><kbd style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px' }}>⌘/</kbd></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Switch to tab 1–9</span><kbd style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px' }}>1–9</kbd></div>
            </div>
            <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Press Escape to close</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
