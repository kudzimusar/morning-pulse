/**
 * Settings Tab
 * Platform configuration and feature flags
 */

import React, { useState } from 'react';
import { Firestore } from 'firebase/firestore';

interface SettingsTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  userRoles: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  firebaseInstances,
  userRoles,
  showToast,
}) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [requireImage, setRequireImage] = useState(true);

  const handleSaveSettings = () => {
    // TODO: Save settings to Firestore
    showToast('Settings saved successfully', 'success');
  };

  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

  if (!isAdmin) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#999'
      }}>
        Settings are only available to administrators.
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        Platform Settings
      </h2>

      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fff',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          Publishing Settings
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={requireImage}
              onChange={(e) => setRequireImage(e.target.checked)}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span>Require image before publishing</span>
          </label>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span>Auto-publish approved articles (coming soon)</span>
          </label>
        </div>
      </div>

      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fff',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          System Settings
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span>Maintenance mode (coming soon)</span>
          </label>
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '4px',
            marginLeft: '26px'
          }}>
            When enabled, the public site will show a maintenance message.
          </div>
        </div>
      </div>

      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fff',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          Platform Information
        </h3>
        <div style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.6'
        }}>
          <div><strong>App ID:</strong> morning-pulse-app</div>
          <div><strong>Firestore Path:</strong> artifacts/morning-pulse-app/public/data/opinions</div>
          <div><strong>Storage Path:</strong> published_images/</div>
          <div><strong>Staff Collection:</strong> /staff/{'{uid}'}</div>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        style={{
          padding: '10px 20px',
          backgroundColor: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        Save Settings
      </button>
    </div>
  );
};

export default SettingsTab;
