import React, { useState, useEffect } from 'react';
import { getAdSlot, AdSlot } from '../../services/advertiserService';
import { initializeDefaultAdSlots } from '../../services/adSlotInitializer';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

interface PlacementsTabProps {
  userRoles: string[] | null;
}

const PlacementsTab: React.FC<PlacementsTabProps> = ({ userRoles }) => {
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdSlot>>({});

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      setLoading(true);
      const db = getFirestore(getApp());
      const slotsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adSlots');
      const snapshot = await getDocs(slotsRef);
      
      const slotsList: AdSlot[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        slotsList.push({
          slotId: docSnap.id,
          pageType: data.pageType || 'article',
          sizes: data.sizes || [],
          priorityTier: data.priorityTier || 'standard',
          maxAds: data.maxAds || 1,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });
      
      setSlots(slotsList.sort((a, b) => a.slotId.localeCompare(b.slotId)));
    } catch (error: any) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSlots = async () => {
    if (!confirm('This will create default ad slots. Continue?')) {
      return;
    }

    try {
      await initializeDefaultAdSlots();
      await loadSlots();
      alert('Default ad slots initialized successfully!');
    } catch (error: any) {
      alert(`Failed to initialize slots: ${error.message}`);
    }
  };

  const handleEditSlot = (slot: AdSlot) => {
    setEditingSlot(slot.slotId);
    setEditForm({
      priorityTier: slot.priorityTier,
      maxAds: slot.maxAds,
      sizes: slot.sizes,
    });
  };

  const handleSaveSlot = async (slotId: string) => {
    try {
      const db = getFirestore(getApp());
      const slotRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'adSlots', slotId);
      
      await updateDoc(slotRef, {
        priorityTier: editForm.priorityTier,
        maxAds: editForm.maxAds,
        sizes: editForm.sizes,
        updatedAt: serverTimestamp(),
      });
      
      setEditingSlot(null);
      setEditForm({});
      await loadSlots();
      alert('Slot updated successfully!');
    } catch (error: any) {
      alert(`Failed to update slot: ${error.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading placements...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Ad Slot Inventory</h3>
        <button
          onClick={handleInitializeSlots}
          style={{
            padding: '8px 16px',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Initialize Default Slots
        </button>
      </div>

      {slots.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>No ad slots configured.</p>
          <button
            onClick={handleInitializeSlots}
            style={{
              padding: '10px 20px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Initialize Default Slots
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {slots.map((slot) => (
            <div
              key={slot.slotId}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600' }}>
                {slot.slotId}
              </h4>
              
              {editingSlot === slot.slotId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: '#6b7280' }}>
                      Priority Tier
                    </label>
                    <select
                      value={editForm.priorityTier || 'standard'}
                      onChange={(e) => setEditForm({ ...editForm, priorityTier: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="premium">Premium</option>
                      <option value="standard">Standard</option>
                      <option value="house">House</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: '#6b7280' }}>
                      Max Ads
                    </label>
                    <input
                      type="number"
                      value={editForm.maxAds || 1}
                      onChange={(e) => setEditForm({ ...editForm, maxAds: parseInt(e.target.value) || 1 })}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSaveSlot(slot.slotId)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingSlot(null);
                        setEditForm({});
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                    <div>Page Type: <strong>{slot.pageType}</strong></div>
                    <div style={{ marginTop: '4px' }}>Sizes: {slot.sizes.join(', ') || 'N/A'}</div>
                    <div style={{ marginTop: '4px' }}>Max Ads: <strong>{slot.maxAds}</strong></div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor:
                          slot.priorityTier === 'premium'
                            ? '#fef3c7'
                            : slot.priorityTier === 'house'
                            ? '#fee2e2'
                            : '#e0e7ff',
                        color:
                          slot.priorityTier === 'premium'
                            ? '#92400e'
                            : slot.priorityTier === 'house'
                            ? '#991b1b'
                            : '#3730a3'
                      }}
                    >
                      {slot.priorityTier}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleEditSlot(slot)}
                    style={{
                      marginTop: '12px',
                      padding: '6px 12px',
                      backgroundColor: '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      width: '100%'
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacementsTab;
