/**
 * Published Content Tab
 * Manage published articles - search, filter, edit, unpublish
 */

import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { Opinion } from '../../../types';

const APP_ID = "morning-pulse-app";

interface PublishedContentTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  userRoles: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const PublishedContentTab: React.FC<PublishedContentTabProps> = ({
  firebaseInstances,
  userRoles,
  showToast,
}) => {
  const [publishedOpinions, setPublishedOpinions] = useState<Opinion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');

  useEffect(() => {
    if (!firebaseInstances) return;

    const { db } = firebaseInstances;
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
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
          
          if (opinion.status === 'published') {
            opinions.push(opinion);
          }
        });
        
        opinions.sort((a, b) => {
          const timeA = a.publishedAt?.getTime() || 0;
          const timeB = b.publishedAt?.getTime() || 0;
          return timeB - timeA;
        });
        
        setPublishedOpinions(opinions);
      },
      (error) => {
        console.error('Error subscribing to published opinions:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseInstances]);

  const handleUnpublish = async (opinionId: string) => {
    if (!firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to unpublish this article?')) {
      return;
    }

    try {
      const { db } = firebaseInstances;
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', opinionId);
      
      await updateDoc(opinionRef, {
        status: 'pending',
        isPublished: false,
        updatedAt: serverTimestamp(),
      });
      
      showToast('Article unpublished', 'success');
    } catch (error: any) {
      console.error('Unpublish error:', error);
      showToast(`Unpublish failed: ${error.message}`, 'error');
    }
  };

  const filteredOpinions = publishedOpinions.filter(op => {
    const matchesSearch = !searchTerm || 
      op.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || op.category === filterCategory;
    const matchesAuthor = !filterAuthor || op.authorName === filterAuthor;
    return matchesSearch && matchesCategory && matchesAuthor;
  });

  const categories = Array.from(new Set(publishedOpinions.map(op => op.category).filter(Boolean)));
  const authors = Array.from(new Set(publishedOpinions.map(op => op.authorName).filter(Boolean)));

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        Published Content ({publishedOpinions.length})
      </h2>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterAuthor}
          onChange={(e) => setFilterAuthor(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">All Authors</option>
          {authors.map(author => (
            <option key={author} value={author}>{author}</option>
          ))}
        </select>
      </div>

      {/* Articles List */}
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {filteredOpinions.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999'
          }}>
            No published articles found
          </div>
        ) : (
          filteredOpinions.map((opinion) => (
            <div
              key={opinion.id}
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {opinion.headline}
                  </h3>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    {opinion.authorName} {opinion.category && `• ${opinion.category}`}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    Published: {opinion.publishedAt?.toLocaleDateString() || 'Unknown'}
                  </div>
                </div>
                <button
                  onClick={() => handleUnpublish(opinion.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Unpublish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublishedContentTab;
