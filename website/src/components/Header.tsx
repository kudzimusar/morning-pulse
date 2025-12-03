import React from 'react';

const Header: React.FC = () => {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="newspaper-header">
      <div className="header-content">
        <h1 className="masthead">Morning Pulse</h1>
        <div className="header-meta">
          <p className="date">{dateString}</p>
          <p className="tagline">Your Daily News Source</p>
        </div>
      </div>
    </header>
  );
};

export default Header;

