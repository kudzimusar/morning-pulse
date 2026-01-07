/**
 * Image Compliance Tab
 * Validate and manage images for articles
 */

import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc,
  Firestore
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  getStorage
} from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Opinion } from '../../../types';

const APP_ID = "morning-pulse-app";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const RECOMMENDED_WIDTH = 2000;
const RECOMMENDED_ASPECT_RATIO = 16 / 9;

interface ImageComplianceTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  userRoles: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ImageComplianceTab: React.FC<ImageComplianceTabProps> = ({
  firebaseInstances,
  userRoles,
  showToast,
}) => {
  const [opinionsWithImages, setOpinionsWithImages] = useState<Opinion[]>([]);
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [uploading, setUploading] = useState(false);

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
          
          // Include all opinions with images (pending or published)
          if (opinion.imageUrl || opinion.suggestedImageUrl || opinion.finalImageUrl) {
            opinions.push(opinion);
          }
        });
        
        setOpinionsWithImages(opinions);
      },
      (error) => {
        console.error('Error subscribing to opinions:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseInstances]);

  const validateImage = (file: File): Promise<{ valid: boolean; message: string }> => {
    if (file.size > MAX_IMAGE_BYTES) {
      return Promise.resolve({ valid: false, message: `Image too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max: 5MB` });
    }

    // Check image dimensions
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const aspectRatio = img.width / img.height;
        const aspectRatioDiff = Math.abs(aspectRatio - RECOMMENDED_ASPECT_RATIO);
        
        if (img.width > RECOMMENDED_WIDTH) {
          resolve({ valid: false, message: `Width (${img.width}px) exceeds recommended ${RECOMMENDED_WIDTH}px` });
        } else if (aspectRatioDiff > 0.1) {
          resolve({ valid: false, message: `Aspect ratio (${aspectRatio.toFixed(2)}) should be close to ${RECOMMENDED_ASPECT_RATIO.toFixed(2)} (16:9)` });
        } else {
          resolve({ valid: true, message: 'Image meets requirements' });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, message: 'Invalid image file' });
      };
      img.src = url;
    });
  };

  const handleImageUpload = async (file: File, opinionId: string) => {
    if (!firebaseInstances) return;

    const validation = await validateImage(file);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }

    setUploading(true);
    
    try {
      const app = getApp();
      const storage = getStorage(app);
      const imageRef = ref(storage, `published_images/${opinionId}/${file.name}`);
      
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      const { db } = firebaseInstances;
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', opinionId);
      
      await updateDoc(opinionRef, {
        finalImageUrl: downloadURL,
        updatedAt: new Date(),
      });
      
      showToast('Image uploaded and validated successfully', 'success');
      setSelectedOpinion(null);
    } catch (error: any) {
      console.error('Image upload error:', error);
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (opinion: Opinion): string | null => {
    return opinion.finalImageUrl || opinion.suggestedImageUrl || opinion.imageUrl || null;
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        Image Compliance ({opinionsWithImages.length})
      </h2>

      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
          Image Requirements
        </h3>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#1e40af' }}>
          <li>Maximum width: {RECOMMENDED_WIDTH}px</li>
          <li>Aspect ratio: 16:9 (recommended)</li>
          <li>Maximum file size: 5MB</li>
          <li>Formats: JPG, PNG, WebP</li>
        </ul>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {opinionsWithImages.map((opinion) => {
          const imageUrl = getImageUrl(opinion);
          return (
            <div
              key={opinion.id}
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedOpinion(opinion)}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={opinion.headline}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}
                />
              )}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                {opinion.headline}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>
                {opinion.authorName}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#999',
                marginTop: '4px'
              }}>
                {opinion.status === 'published' ? 'Published' : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Upload Modal */}
      {selectedOpinion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
        onClick={() => setSelectedOpinion(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              Replace Image: {selectedOpinion.headline}
            </h3>
            
            {getImageUrl(selectedOpinion) && (
              <img
                src={getImageUrl(selectedOpinion)!}
                alt="Current"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  border: '1px solid #e5e5e5'
                }}
              />
            )}

            <label style={{
              display: 'block',
              padding: '12px 24px',
              backgroundColor: '#000',
              color: '#fff',
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              fontWeight: '500',
              opacity: uploading ? 0.6 : 1
            }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, selectedOpinion.id);
                  }
                  e.currentTarget.value = '';
                }}
              />
              {uploading ? 'Uploading...' : 'Upload Replacement Image'}
            </label>

            <button
              onClick={() => setSelectedOpinion(null)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '8px',
                backgroundColor: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageComplianceTab;
