import React, { useState, useEffect } from 'react';
import { Firestore, collection, query, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

interface IntegrationSettingsProps {
  userRoles: string[] | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: any;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  event: string;
  createdAt: any;
}

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ userRoles, showToast }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newKey, setNewKey] = useState({ name: '', key: '', service: '' });
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', event: 'article_published' });

  const db = getFirestore(getApp());

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      
      // Load API Keys
      const keysRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'api_keys');
      const keysSnap = await getDocs(keysRef);
      const keysData = keysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApiKey));
      setApiKeys(keysData);

      // Load Webhooks
      const webhooksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'webhooks');
      const webhooksSnap = await getDocs(webhooksRef);
      const webhooksData = webhooksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Webhook));
      setWebhooks(webhooksData);

    } catch (error: any) {
      console.error('Error loading integrations:', error);
      showToast('Failed to load integrations: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.name || !newKey.key) return;

    try {
      const keyId = Date.now().toString();
      const keyRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'api_keys', keyId);
      await setDoc(keyRef, {
        ...newKey,
        createdAt: serverTimestamp()
      });
      
      showToast('API Key added successfully');
      setNewKey({ name: '', key: '', service: '' });
      loadIntegrations();
    } catch (error: any) {
      showToast('Failed to add API key: ' + error.message, 'error');
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.name || !newWebhook.url) return;

    try {
      const webhookId = Date.now().toString();
      const webhookRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'webhooks', webhookId);
      await setDoc(webhookRef, {
        ...newWebhook,
        createdAt: serverTimestamp()
      });
      
      showToast('Webhook added successfully');
      setNewWebhook({ name: '', url: '', event: 'article_published' });
      loadIntegrations();
    } catch (error: any) {
      showToast('Failed to add webhook: ' + error.message, 'error');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading integrations...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '24px' }}>Integration Settings</h2>

      {/* API Keys Section */}
      <section style={{ marginBottom: '40px', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>API Keys</h3>
        
        <form onSubmit={handleAddKey} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input 
            placeholder="Service Name (e.g. Gemini)" 
            value={newKey.name}
            onChange={e => setNewKey({...newKey, name: e.target.value})}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          />
          <input 
            placeholder="API Key" 
            type="password"
            value={newKey.key}
            onChange={e => setNewKey({...newKey, key: e.target.value})}
            style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          />
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Key
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {apiKeys.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No API keys configured.</p>
          ) : (
            apiKeys.map(key => (
              <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>{key.name}</span>
                <span style={{ color: '#6b7280' }}>••••••••••••{key.key.slice(-4)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Webhooks Section */}
      <section style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Webhooks</h3>
        
        <form onSubmit={handleAddWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              placeholder="Webhook Name" 
              value={newWebhook.name}
              onChange={e => setNewWebhook({...newWebhook, name: e.target.value})}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <select 
              value={newWebhook.event}
              onChange={e => setNewWebhook({...newWebhook, event: e.target.value})}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="article_published">Article Published</option>
              <option value="new_subscriber">New Subscriber</option>
              <option value="ad_approved">Ad Approved</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              placeholder="Webhook URL (https://...)" 
              value={newWebhook.url}
              onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add Webhook
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {webhooks.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No webhooks configured.</p>
          ) : (
            webhooks.map(hook => (
              <div key={hook.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{hook.name}</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#e5e7eb', borderRadius: '12px' }}>{hook.event}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hook.url}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default IntegrationSettings;
