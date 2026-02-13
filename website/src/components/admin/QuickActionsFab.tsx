import React, { useState } from 'react';
import { FileEdit, Users, TrendingUp, Bell } from 'lucide-react';

interface QuickActionsFabProps {
  onNewArticle: () => void;
  onInviteStaff: () => void;
  onGenerateReport: () => void;
  onNotifications: () => void;
}

const QuickActionsFab: React.FC<QuickActionsFabProps> = ({
  onNewArticle,
  onInviteStaff,
  onGenerateReport,
  onNotifications,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="quick-actions-fab">
      {open && (
        <div className="quick-actions-fab-menu">
          <button type="button" onClick={() => { onNewArticle(); setOpen(false); }} className="quick-actions-fab-item">
            <span className="inline-flex items-center justify-center w-4 h-4 mr-1" aria-hidden><FileEdit size={16} /></span> New article
          </button>
          <button type="button" onClick={() => { onInviteStaff(); setOpen(false); }} className="quick-actions-fab-item">
            <span className="inline-flex items-center justify-center w-4 h-4 mr-1" aria-hidden><Users size={16} /></span> Invite staff
          </button>
          <button type="button" onClick={() => { onGenerateReport(); setOpen(false); }} className="quick-actions-fab-item">
            <span className="inline-flex items-center justify-center w-4 h-4 mr-1" aria-hidden><TrendingUp size={16} /></span> Generate report
          </button>
          <button type="button" onClick={() => { onNotifications(); setOpen(false); }} className="quick-actions-fab-item">
            <span className="inline-flex items-center justify-center w-4 h-4 mr-1" aria-hidden><Bell size={16} /></span> Notifications
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="quick-actions-fab-main"
        aria-label={open ? 'Close quick actions menu' : 'Open quick actions menu'}
      >
        {open ? '✕' : '+'}
      </button>
    </div>
  );
};

export default QuickActionsFab;
