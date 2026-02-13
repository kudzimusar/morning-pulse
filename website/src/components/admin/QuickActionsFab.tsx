import React, { useState } from 'react';

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
            <span>📝</span> New article
          </button>
          <button type="button" onClick={() => { onInviteStaff(); setOpen(false); }} className="quick-actions-fab-item">
            <span>👥</span> Invite staff
          </button>
          <button type="button" onClick={() => { onGenerateReport(); setOpen(false); }} className="quick-actions-fab-item">
            <span>📈</span> Generate report
          </button>
          <button type="button" onClick={() => { onNotifications(); setOpen(false); }} className="quick-actions-fab-item">
            <span>🔔</span> Notifications
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
