import React, { useState } from 'react';
import { createInvoice, sendInvoice, InvoiceLineItem } from '../../services/billingService';
import { getApprovedAdvertisers, Advertiser } from '../../services/advertiserService';

interface InvoiceGeneratorProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  advertiserId?: string;
  adId?: string;
  campaignId?: string;
  defaultAmount?: number;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  onSuccess,
  onCancel,
  advertiserId: initialAdvertiserId,
  adId,
  campaignId,
  defaultAmount,
}) => {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    advertiserId: initialAdvertiserId || '',
    amount: defaultAmount || 0,
    currency: 'USD',
    description: '',
    dueDays: 30,
    notes: '',
    autoSend: true,
  });

  React.useEffect(() => {
    loadAdvertisers();
  }, []);

  const loadAdvertisers = async () => {
    try {
      const list = await getApprovedAdvertisers();
      setAdvertisers(list);
    } catch (err: any) {
      console.error('Error loading advertisers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.advertiserId) {
      setError('Please select an advertiser');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      const lineItems: InvoiceLineItem[] = [{
        description: formData.description || 'Advertising Services',
        quantity: 1,
        unitPrice: formData.amount,
        total: formData.amount,
      }];

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + formData.dueDays);

      const invoiceId = await createInvoice(formData.advertiserId, {
        campaignId,
        adId,
        amount: formData.amount,
        currency: formData.currency,
        lineItems,
        dueDate,
        notes: formData.notes || undefined,
      });

      if (formData.autoSend) {
        await sendInvoice(invoiceId);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        alert('Invoice created successfully!');
      }
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>Generate Invoice</h3>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#991b1b',
          marginBottom: '16px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
            Advertiser <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            value={formData.advertiserId}
            onChange={(e) => setFormData({ ...formData, advertiserId: e.target.value })}
            required
            disabled={!!initialAdvertiserId || submitting}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Select advertiser...</option>
            {advertisers.map((adv) => (
              <option key={adv.uid} value={adv.uid}>
                {adv.companyName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
              Amount <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="USD">USD</option>
              <option value="ZWL">ZWL</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={submitting}
            placeholder="e.g., Premium Header Banner - 30 days"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
            Due Date (days from now)
          </label>
          <input
            type="number"
            min="1"
            value={formData.dueDays}
            onChange={(e) => setFormData({ ...formData, dueDays: parseInt(e.target.value) || 30 })}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={submitting}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={formData.autoSend}
              onChange={(e) => setFormData({ ...formData, autoSend: e.target.checked })}
              disabled={submitting}
            />
            Auto-send invoice after creation
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: submitting ? '#9ca3af' : '#000',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceGenerator;
