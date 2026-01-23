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
  updateDoc, 
  getDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Opinion } from '../../types';
import { getUIStatusLabel, getDbStatus, UIStatusLabel } from '../utils/opinionStatus';

// Constants
const APP_ID = (window as any).__app_id || 'morning-pulse-app';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// Get Firebase instances (reuse existing app)
const getFirebaseInstances = () => {
  try {
    const app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    return { auth, db, storage };
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

const AdminPortal: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Pending queue
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [selectedOpinionId, setSelectedOpinionId] = useState<string | null>(null);
  
  // Editor suite (local state)
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubHeadline, setEditedSubHeadline] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedAuthorName, setEditedAuthorName] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [status, setStatus] = useState<UIStatusLabel>('Submitted');
  const [suggestedImageUrl, setSuggestedImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Firebase instances
  const [firebaseInstances, setFirebaseInstances] = useState<{
    auth: any;
    db: Firestore;
    storage: FirebaseStorage;
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
          } else {
            setUserRoles([]);
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('Error checking staff role:', error);
          setUserRoles([]);
          setIsAuthorized(false);
        }
      } else {
        setUserRoles([]);
        setIsAuthorized(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseInstances]);

  // Subscribe to pending opinions
  useEffect(() => {
    if (!isAuthorized || !firebaseInstances) return;

    const { db } = firebaseInstances;
    
    // CRITICAL: Use appId-scoped path - artifacts/morning-pulse-app/public/data/opinions
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
    
    // Query for pending status (filter in memory to avoid index issues)
    const q = query(opinionsRef);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions: Opinion[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const opinion = {
            id: docSnap.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            publishedAt: data.publishedAt?.toDate?.() || null,
          } as Opinion;
          
          // Filter for pending status (Submitted or Under Review)
          if (opinion.status === 'pending') {
            opinions.push(opinion);
          }
        });
        
        // Sort by submission date (newest first)
        opinions.sort((a, b) => {
          const timeA = a.submittedAt?.getTime() || 0;
          const timeB = b.submittedAt?.getTime() || 0;
          return timeB - timeA;
        });
        
        setPendingOpinions(opinions);
      },
      (error) => {
        console.error('Error subscribing to opinions:', error);
        showToast('Failed to load pending opinions', 'error');
      }
    );

    return () => unsubscribe();
  }, [isAuthorized, firebaseInstances]);

  // Load selected opinion into editor
  useEffect(() => {
    if (!selectedOpinionId) {
      // Clear editor
      setEditedTitle('');
      setEditedSubHeadline('');
      setEditedBody('');
      setEditedAuthorName('');
      setEditorNotes('');
      setStatus('Submitted');
      setSuggestedImageUrl(null);
      setFinalImageUrl(null);
      return;
    }

    const opinion = pendingOpinions.find(op => op.id === selectedOpinionId);
    if (opinion) {
      setEditedTitle(opinion.headline || '');
      setEditedSubHeadline(opinion.subHeadline || '');
      setEditedBody(opinion.body || '');
      setEditedAuthorName(opinion.authorName || '');
      setEditorNotes(opinion.editorNotes || '');
      setStatus(getUIStatusLabel(opinion.status || 'pending') as UIStatusLabel);
      setSuggestedImageUrl(opinion.suggestedImageUrl || opinion.imageUrl || null);
      setFinalImageUrl(opinion.finalImageUrl || null);
    }
  }, [selectedOpinionId, pendingOpinions]);

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
      // Auth state listener will handle the rest
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
      // Redirect to home page with base path
      const baseUrl = window.location.origin + '/morning-pulse';
      window.location.href = `${baseUrl}/#/`;
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed', 'error');
    }
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!selectedOpinionId || !firebaseInstances) return;
    
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Image too large (max 5MB)', 'error');
      return;
    }

    setUploadingImage(true);
    
    try {
      const { storage } = firebaseInstances;
      const imageRef = ref(storage, `published_images/${selectedOpinionId}/${file.name}`);
      
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      setFinalImageUrl(downloadURL);
      showToast('Image uploaded successfully', 'success');
    } catch (error: any) {
      console.error('Image upload error:', error);
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save draft handler
  const handleSaveDraft = async () => {
    if (!selectedOpinionId || !isAuthorized || !firebaseInstances) return;
    
    // Security guard
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      // CRITICAL: Use appId-scoped path
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', selectedOpinionId);
      
      const dbStatus = getDbStatus(status);
      
      await updateDoc(opinionRef, {
        headline: editedTitle,
        subHeadline: editedSubHeadline,
        body: editedBody,
        authorName: editedAuthorName,
        editorNotes: editorNotes,
        status: dbStatus,
        finalImageUrl: finalImageUrl || suggestedImageUrl,
        updatedAt: serverTimestamp(),
      });
      
      showToast('Draft saved', 'success');
    } catch (error: any) {
      console.error('Save draft error:', error);
      showToast(`Save failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Approve & Publish handler
  const handleApproveAndPublish = async () => {
    if (!selectedOpinionId || !isAuthorized || !firebaseInstances) return;
    
    // Security guard
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    // Verify image
    const imageToUse = finalImageUrl || suggestedImageUrl;
    if (!imageToUse) {
      showToast('Please upload or select an image before publishing', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      // CRITICAL: Use appId-scoped path
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', selectedOpinionId);
      
      await updateDoc(opinionRef, {
        headline: editedTitle,
        subHeadline: editedSubHeadline,
        body: editedBody,
        authorName: editedAuthorName,
        editorNotes: editorNotes,
        status: 'published',
        isPublished: true,
        finalImageUrl: imageToUse,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      showToast('Article published successfully!', 'success');
      
      // Clear selection after publish
      setTimeout(() => {
        setSelectedOpinionId(null);
      }, 1000);
    } catch (error: any) {
      console.error('Publish error:', error);
      showToast(`Publish failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reject handler
  const handleReject = async () => {
    if (!selectedOpinionId || !isAuthorized || !firebaseInstances) return;
    
    // Security guard
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this article?')) {
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      // CRITICAL: Use appId-scoped path
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', selectedOpinionId);
      
      await updateDoc(opinionRef, {
        status: 'rejected',
        editorNotes: editorNotes,
        updatedAt: serverTimestamp(),
      });
      
      showToast('Article rejected', 'success');
      
      // Clear selection after reject
      setTimeout(() => {
        setSelectedOpinionId(null);
      }, 1000);
    } catch (error: any) {
      console.error('Reject error:', error);
      showToast(`Reject failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

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

      {/* Split Screen Layout */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Panel - Pending Queue */}
        <div style={{
          width: '400px',
          borderRight: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#f9f9f9'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Pending Queue ({pendingOpinions.length})
            </h2>
          </div>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {pendingOpinions.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#999'
              }}>
                No pending submissions
              </div>
            ) : (
              pendingOpinions.map((opinion) => (
                <div
                  key={opinion.id}
                  onClick={() => setSelectedOpinionId(opinion.id)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    border: selectedOpinionId === opinion.id ? '2px solid #000' : '1px solid #e5e5e5',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedOpinionId === opinion.id ? '#f0f0f0' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px',
                    color: '#000'
                  }}>
                    {opinion.headline || 'Untitled'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    {opinion.authorName}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#999'
                  }}>
                    {opinion.submittedAt?.toLocaleDateString() || 'Recently'}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#666'
                  }}>
                    {getUIStatusLabel(opinion.status || 'pending')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Editor Suite */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}>
          {!selectedOpinionId ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#999',
              fontSize: '16px'
            }}>
              Select an article from the queue to begin editing
            </div>
          ) : (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              {/* Status Dropdown */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UIStatusLabel)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Published">Published</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Sub-headline */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Sub-headline
                </label>
                <input
                  type="text"
                  value={editedSubHeadline}
                  onChange={(e) => setEditedSubHeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Author Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Author Name
                </label>
                <input
                  type="text"
                  value={editedAuthorName}
                  onChange={(e) => setEditedAuthorName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Image Management */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Image
                </label>
                <div style={{
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Images should not exceed 2000px width.
                </div>
                
                {suggestedImageUrl && (
                  <div style={{ marginBottom: '12px' }}>
                    <img
                      src={finalImageUrl || suggestedImageUrl}
                      alt="Article image"
                      style={{
                        width: '100%',
                        maxWidth: '600px',
                        height: 'auto',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                    />
                  </div>
                )}
                
                <label style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: uploadingImage ? 0.6 : 1
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  {uploadingImage ? 'Uploading...' : 'Replace Image'}
                </label>
              </div>

              {/* Body */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Body (HTML)
                </label>
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Editor Notes (Private) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Editor Notes (Private)
                </label>
                <textarea
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes (not published)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e5e5'
              }}>
                <button
                  onClick={handleReject}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  Reject
                </button>
                
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                
                <button
                  onClick={handleApproveAndPublish}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Publishing...' : 'Approve & Publish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
