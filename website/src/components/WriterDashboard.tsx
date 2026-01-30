import React, { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getCurrentWriter, updateWriterProfile, Writer, acknowledgeStyleGuide } from '../services/writerService';
import { getPublishedOpinions, Opinion, submitForReview } from '../services/opinionsService';
import { getWriterPitches, submitPitch, deletePitch } from '../services/pitchService';
import { getWriterMetrics, calculateWriterMetricsOnTheFly } from '../services/writerMetricsService';
import { StoryPitch, WriterMetrics } from '../../types';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import PitchSubmissionForm from './writer/PitchSubmissionForm';
import StyleGuideModal from './writer/StyleGuideModal';

const WriterDashboard: React.FC = () => {
  const [writer, setWriter] = useState<Writer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]); // NEW: Separate list for drafts
  const [pitches, setPitches] = useState<StoryPitch[]>([]); // Story pitches
  const [metrics, setMetrics] = useState<WriterMetrics | null>(null); // Sprint 3: Performance metrics
  const [loadingMetrics, setLoadingMetrics] = useState(false); // Sprint 3: Loading state
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'pitches' | 'performance' | 'profile'>('overview');
  const [submittingForReview, setSubmittingForReview] = useState<string | null>(null); // NEW: Track submission in progress
  const [showPitchForm, setShowPitchForm] = useState(false); // Toggle pitch form
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
  });
  // Sprint 6: Style Guide compliance
  const [showStyleGuideModal, setShowStyleGuideModal] = useState(false);
  const [styleGuideChecked, setStyleGuideChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const writerData = await getCurrentWriter();
          if (writerData && writerData.status === 'approved') {
            setWriter(writerData);
            setProfileData({
              name: writerData.name,
              bio: writerData.bio || '',
            });
            // Load submissions after writer is set
            setTimeout(() => {
              loadSubmissions(currentUser.uid);
            }, 100);
          } else {
            // Not an approved writer
            window.location.hash = 'writer/login';
          }
        } catch (error) {
          console.error('Error loading writer data:', error);
        }
      } else {
        window.location.hash = 'writer/login';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reload submissions and pitches when writer changes
  useEffect(() => {
    if (writer && user) {
      loadSubmissions(user.uid);
      loadPitches(user.uid);
    }
  }, [writer]);

  // Sprint 3: Load metrics when Performance tab is selected
  useEffect(() => {
    if (activeTab === 'performance' && user && !metrics && !loadingMetrics) {
      loadMetrics(user.uid);
    }
  }, [activeTab, user]);

  // Sprint 6: Check if style guide acknowledgement is needed
  useEffect(() => {
    if (writer && !styleGuideChecked) {
      setStyleGuideChecked(true);
      
      const lastAck = writer.compliance?.lastStyleGuideAck;
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      
      // Show modal if: never acknowledged OR acknowledged more than 30 days ago
      if (!lastAck) {
        console.log('📝 Style guide never acknowledged, showing modal');
        setShowStyleGuideModal(true);
      } else {
        const daysSinceAck = (Date.now() - lastAck.getTime()) / THIRTY_DAYS_MS;
        if (daysSinceAck > 1) { // More than 30 days
          console.log('📝 Style guide acknowledgement expired, showing modal');
          setShowStyleGuideModal(true);
        }
      }
    }
  }, [writer, styleGuideChecked]);

  // Sprint 6: Handle style guide acceptance
  const handleStyleGuideAccept = async () => {
    if (!user) return;
    
    await acknowledgeStyleGuide(user.uid);
    setShowStyleGuideModal(false);
    
    // Update local writer state with new compliance timestamp
    if (writer) {
      setWriter({
        ...writer,
        compliance: {
          ...writer.compliance,
          lastStyleGuideAck: new Date()
        }
      });
    }
  };

  // Load writer's pitches
  const loadPitches = async (writerUid: string) => {
    try {
      const writerPitches = await getWriterPitches(writerUid);
      setPitches(writerPitches);
    } catch (error) {
      console.error('Error loading pitches:', error);
    }
  };

  // Sprint 3: Load writer's performance metrics
  const loadMetrics = async (writerUid: string) => {
    setLoadingMetrics(true);
    try {
      // Try to get pre-computed metrics first
      let writerMetrics = await getWriterMetrics(writerUid);
      
      // If no pre-computed metrics, calculate on-the-fly
      if (!writerMetrics) {
        console.log('📊 No pre-computed metrics, calculating on-the-fly...');
        writerMetrics = await calculateWriterMetricsOnTheFly(writerUid);
      }
      
      setMetrics(writerMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadSubmissions = async (writerUid: string) => {
    if (!writer) return;
    
    try {
      const db = getFirestore(getApp());
      const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
      const q = query(opinionsRef, where('authorName', '==', writer.name));
      
      const snapshot = await getDocs(q);
      const submissionsList: any[] = [];
      const draftsList: any[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const item = {
          id: docSnap.id,
          headline: data.headline,
          status: data.status || 'pending',
          isPublished: data.isPublished || false,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          publishedAt: data.publishedAt?.toDate?.() || undefined,
          editorNotes: data.editorNotes || null, // NEW: Include editor feedback
          returnedAt: data.returnedAt?.toDate?.() || undefined, // NEW: When returned
        };
        
        // NEW: Separate drafts from other submissions
        if (data.status === 'draft') {
          draftsList.push(item);
        } else {
          submissionsList.push(item);
        }
      });
      
      setDrafts(draftsList.sort((a, b) => 
        b.submittedAt.getTime() - a.submittedAt.getTime()
      ));
      setSubmissions(submissionsList.sort((a, b) => 
        b.submittedAt.getTime() - a.submittedAt.getTime()
      ));
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.hash = 'writer/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!writer) return;
    
    try {
      await updateWriterProfile(writer.uid, {
        name: profileData.name,
        bio: profileData.bio,
      });
      
      // Reload writer data
      const updatedWriter = await getCurrentWriter();
      if (updatedWriter) {
        setWriter(updatedWriter);
      }
      
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  // NEW: Submit draft for editorial review
  const handleSubmitForReview = async (draftId: string) => {
    if (!window.confirm('Submit this draft for editorial review?')) {
      return;
    }

    setSubmittingForReview(draftId);
    
    try {
      await submitForReview(draftId);
      alert('Draft submitted for review! Editors will review it shortly.');
      
      // Reload submissions
      if (user) {
        loadSubmissions(user.uid);
      }
    } catch (error: any) {
      alert(`Failed to submit for review: ${error.message}`);
    } finally {
      setSubmittingForReview(null);
    }
  };

  // Handle deleting a draft pitch
  const handleDeletePitch = async (pitchId: string) => {
    if (!window.confirm('Delete this pitch? This cannot be undone.')) {
      return;
    }

    try {
      await deletePitch(pitchId);
      // Reload pitches
      if (user) {
        loadPitches(user.uid);
      }
      alert('Pitch deleted.');
    } catch (error: any) {
      alert(`Failed to delete pitch: ${error.message}`);
    }
  };

  // Handle submitting a draft pitch
  const handleSubmitPitch = async (pitchId: string) => {
    if (!window.confirm('Submit this pitch for editorial review?')) {
      return;
    }

    try {
      await submitPitch(pitchId);
      alert('Pitch submitted for review!');
      // Reload pitches
      if (user) {
        loadPitches(user.uid);
      }
    } catch (error: any) {
      alert(`Failed to submit pitch: ${error.message}`);
    }
  };

  // Get pitch status color
  const getPitchStatusStyle = (status: string) => {
    switch (status) {
      case 'draft': return { bg: '#f3f4f6', color: '#6b7280' };
      case 'submitted': return { bg: '#fef3c7', color: '#92400e' };
      case 'approved': return { bg: '#d1fae5', color: '#065f46' };
      case 'rejected': return { bg: '#fee2e2', color: '#991b1b' };
      case 'converted': return { bg: '#dbeafe', color: '#1e40af' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!writer || writer.status !== 'approved') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2>Access Denied</h2>
          <p>Your writer account is not yet approved.</p>
          <button onClick={handleLogout} style={{
            marginTop: '16px',
            padding: '10px 20px',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  const publishedCount = submissions.filter(s => s.isPublished).length;
  const pendingCount = submissions.filter(s => (s.status === 'pending' || s.status === 'in-review') && !s.isPublished).length;
  const draftCount = drafts.length; // NEW: Count drafts separately
  const hasEditorFeedback = submissions.some(s => s.editorNotes); // NEW: Check if any story has feedback
  const approvedPitchesCount = pitches.filter(p => p.status === 'approved').length;
  const pendingPitchesCount = pitches.filter(p => p.status === 'submitted').length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      {/* Sprint 6: Style Guide Modal */}
      <StyleGuideModal
        isOpen={showStyleGuideModal}
        onAccept={handleStyleGuideAccept}
        onClose={() => setShowStyleGuideModal(false)}
        writerName={writer?.displayName || writer?.name}
        isRequired={!writer?.compliance?.lastStyleGuideAck} // Required on first acknowledgement
      />
      {/* Header */}
      <div style={{
        backgroundColor: '#000',
        color: 'white',
        padding: '20px 0',
        marginBottom: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Writer Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem' }}>{writer.name}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'overview' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? '600' : '400',
              color: activeTab === 'overview' ? '#000' : '#6b7280'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'submissions' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'submissions' ? '600' : '400',
              color: activeTab === 'submissions' ? '#000' : '#6b7280'
            }}
          >
            My Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('pitches')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'pitches' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'pitches' ? '600' : '400',
              color: activeTab === 'pitches' ? '#000' : '#6b7280'
            }}
          >
            Story Pitches ({pitches.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'performance' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'performance' ? '600' : '400',
              color: activeTab === 'performance' ? '#000' : '#6b7280'
            }}
          >
            📊 Performance
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'profile' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'profile' ? '600' : '400',
              color: activeTab === 'profile' ? '#000' : '#6b7280'
            }}
          >
            Profile
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Overview</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {draftCount}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Drafts</div>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#d97706' }}>
                  {pendingCount}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Under Review</div>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#16a34a' }}>
                  {publishedCount}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Published</div>
              </div>
              
              {hasEditorFeedback && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Editor Feedback</div>
                </div>
              )}
              
              {approvedPitchesCount > 0 && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#065f46' }}>
                    {approvedPitchesCount}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Approved Pitches</div>
                </div>
              )}
              
              {pendingPitchesCount > 0 && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '6px',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
                    {pendingPitchesCount}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pitches Pending Review</div>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="#opinion/submit"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#000',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}
                >
                  Submit New Article
                </a>
                <button
                  onClick={() => {
                    setActiveTab('pitches');
                    setShowPitchForm(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1e40af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  💡 Submit Story Pitch
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>My Work</h2>
            
            {/* NEW: Drafts Section */}
            {drafts.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📝 Drafts ({drafts.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{draft.headline}</h3>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Last saved: {draft.submittedAt.toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSubmitForReview(draft.id)}
                          disabled={submittingForReview === draft.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#1e40af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: submittingForReview === draft.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            opacity: submittingForReview === draft.id ? 0.6 : 1
                          }}
                        >
                          {submittingForReview === draft.id ? 'Submitting...' : 'Submit for Review'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Submitted/Published Articles Section */}
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#374151'
              }}>
                Submissions ({submissions.length})
              </h3>
              
              {submissions.length === 0 ? (
                <p style={{ color: '#6b7280' }}>You haven't submitted any articles yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{submission.headline}</h3>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
                            <span>Submitted: {submission.submittedAt.toLocaleDateString()}</span>
                            {submission.publishedAt && (
                              <span>Published: {submission.publishedAt.toLocaleDateString()}</span>
                            )}
                            {submission.returnedAt && (
                              <span>Returned: {submission.returnedAt.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              backgroundColor:
                                submission.isPublished
                                  ? '#d1fae5'
                                  : submission.status === 'in-review'
                                  ? '#dbeafe'
                                  : submission.status === 'pending'
                                  ? '#fef3c7'
                                  : submission.status === 'rejected'
                                  ? '#fee2e2'
                                  : '#f3f4f6',
                              color:
                                submission.isPublished
                                  ? '#065f46'
                                  : submission.status === 'in-review'
                                  ? '#1e40af'
                                  : submission.status === 'pending'
                                  ? '#92400e'
                                  : submission.status === 'rejected'
                                  ? '#991b1b'
                                  : '#6b7280'
                            }}
                          >
                            {submission.isPublished ? 'Published' : 
                             submission.status === 'in-review' ? 'In Edit' :
                             submission.status === 'pending' ? 'Pending Review' : 
                             submission.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* NEW: Display Editor Feedback */}
                      {submission.editorNotes && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          backgroundColor: '#fef3c7',
                          borderLeft: '3px solid #f59e0b',
                          borderRadius: '4px'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#92400e',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            💬 Editor Feedback
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#78350f',
                            lineHeight: '1.5'
                          }}>
                            {submission.editorNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pitches' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {showPitchForm ? (
              <PitchSubmissionForm
                onSuccess={(pitchId) => {
                  setShowPitchForm(false);
                  if (user) {
                    loadPitches(user.uid);
                  }
                }}
                onCancel={() => setShowPitchForm(false)}
              />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0 }}>Story Pitches</h2>
                  <button
                    onClick={() => setShowPitchForm(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    + New Pitch
                  </button>
                </div>

                <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.875rem' }}>
                  Submit story ideas for editorial approval. Approved pitches can be developed into full articles.
                </p>

                {pitches.length === 0 ? (
                  <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
                    <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
                      You haven't submitted any story pitches yet.
                    </p>
                    <button
                      onClick={() => setShowPitchForm(true)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Submit Your First Pitch
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pitches.map(pitch => (
                      <div
                        key={pitch.id}
                        style={{
                          padding: '20px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: pitch.status === 'approved' ? '#f0fdf4' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{pitch.title}</h3>
                            <p style={{ margin: 0, color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.5' }}>
                              {pitch.summary}
                            </p>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: getPitchStatusStyle(pitch.status).bg,
                            color: getPitchStatusStyle(pitch.status).color,
                            textTransform: 'capitalize',
                            marginLeft: '12px',
                            whiteSpace: 'nowrap'
                          }}>
                            {pitch.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#6b7280', marginBottom: '12px' }}>
                          {pitch.proposedCategory && <span>Category: {pitch.proposedCategory}</span>}
                          {pitch.estimatedWordCount && <span>~{pitch.estimatedWordCount} words</span>}
                          <span>Created: {pitch.createdAt ? new Date(pitch.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>

                        {/* Editor Feedback */}
                        {pitch.editorFeedback && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#d1fae5',
                            borderRadius: '6px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#065f46', marginBottom: '4px' }}>
                              Editor Feedback
                            </div>
                            <p style={{ margin: 0, color: '#065f46', fontSize: '0.875rem' }}>
                              {pitch.editorFeedback}
                            </p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {pitch.status === 'rejected' && pitch.rejectionReason && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '6px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                              Rejection Reason
                            </div>
                            <p style={{ margin: 0, color: '#991b1b', fontSize: '0.875rem' }}>
                              {pitch.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Actions for draft pitches */}
                        {pitch.status === 'draft' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              onClick={() => handleSubmitPitch(pitch.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#1e40af',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                            >
                              Submit for Review
                            </button>
                            <button
                              onClick={() => handleDeletePitch(pitch.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* Approved pitch - prompt to write article */}
                        {pitch.status === 'approved' && !pitch.convertedToOpinionId && (
                          <div style={{ marginTop: '12px' }}>
                            <a
                              href="#opinion/submit"
                              style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                            >
                              ✍️ Write This Article
                            </a>
                          </div>
                        )}

                        {/* Converted pitch */}
                        {pitch.status === 'converted' && pitch.convertedToOpinionId && (
                          <div style={{
                            marginTop: '12px',
                            padding: '8px 12px',
                            backgroundColor: '#dbeafe',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: '#1e40af'
                          }}>
                            ✅ This pitch has been converted to an article
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Sprint 3: Performance Tab */}
        {activeTab === 'performance' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>📊 Performance Analytics</h2>
            
            {loadingMetrics ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                <p>Loading your performance data...</p>
              </div>
            ) : !metrics ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                <p>No performance data available yet.</p>
                <p style={{ fontSize: '0.875rem' }}>Submit and publish articles to see your analytics here.</p>
              </div>
            ) : (
              <>
                {/* 30-Day Rolling Metrics */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#374151' }}>Last 30 Days</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                        {metrics.rolling30d.published}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Published</div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fde68a',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
                        {metrics.rolling30d.submitted}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Submitted</div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '8px',
                      border: '1px solid #93c5fd',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                        {metrics.rolling30d.avgReviewHours}h
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Review Time</div>
                    </div>
                    
                    {metrics.rolling30d.rejected > 0 && (
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '8px',
                        border: '1px solid #fecaca',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                          {metrics.rolling30d.rejectionRate}%
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Rejection Rate</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifetime Metrics */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#374151' }}>Lifetime Stats</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        {metrics.lifetime.totalPublished}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Published</div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        {metrics.lifetime.totalSubmitted}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Submitted</div>
                    </div>
                    
                    {metrics.lifetime.firstPublishedAt && (
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                          {new Date(metrics.lifetime.firstPublishedAt).toLocaleDateString()}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>First Published</div>
                      </div>
                    )}
                    
                    {metrics.lifetime.lastPublishedAt && (
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                          {new Date(metrics.lifetime.lastPublishedAt).toLocaleDateString()}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Last Published</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Breakdown */}
                {metrics.categoryBreakdown && Object.keys(metrics.categoryBreakdown).length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: '16px', color: '#374151' }}>Articles by Category</h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      {Object.entries(metrics.categoryBreakdown).map(([category, stats]) => (
                        <div
                          key={category}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{category}</span>
                          <span style={{
                            backgroundColor: '#000',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {stats.published}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics last computed */}
                <div style={{
                  marginTop: '32px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  Metrics last updated: {metrics.lastComputed ? new Date(metrics.lastComputed).toLocaleString() : 'Unknown'}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Profile</h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editingProfile ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileData({
                        name: writer.name,
                        bio: writer.bio || '',
                      });
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '1rem' }}>{writer.email}</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Name</div>
                  <div style={{ fontSize: '1rem' }}>{writer.name}</div>
                </div>
                {writer.bio && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Bio</div>
                    <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>{writer.bio}</div>
                  </div>
                )}
                
                {/* Sprint 6: Style Guide Compliance Section */}
                <div style={{ 
                  marginTop: '32px', 
                  paddingTop: '24px', 
                  borderTop: '1px solid #e5e7eb' 
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                    📋 Compliance & Guidelines
                  </h3>
                  
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Style Guide Acknowledgement</span>
                      {writer.compliance?.lastStyleGuideAck ? (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#059669', 
                          backgroundColor: '#d1fae5', 
                          padding: '2px 8px', 
                          borderRadius: '12px' 
                        }}>
                          ✓ Acknowledged
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#dc2626', 
                          backgroundColor: '#fee2e2', 
                          padding: '2px 8px', 
                          borderRadius: '12px' 
                        }}>
                          ⚠️ Not acknowledged
                        </span>
                      )}
                    </div>
                    
                    {writer.compliance?.lastStyleGuideAck && (
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 12px 0' }}>
                        Last acknowledged: {new Date(writer.compliance.lastStyleGuideAck).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    
                    <button
                      onClick={() => setShowStyleGuideModal(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📝 View Style Guide
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WriterDashboard;
