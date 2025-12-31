import React, { useState } from 'react';

interface DatePickerProps {
  onDateSelect: (date: string) => void;
  currentDate: string;
  maxDaysBack: number; // 2 for free, unlimited for subscribed
}

const DatePicker: React.FC<DatePickerProps> = ({ onDateSelect, currentDate, maxDaysBack }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < maxDaysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  return (
    <div className="date-picker-container">
      <button 
        className="date-picker-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>📅</span>
        <span>{formatDate(currentDate)}</span>
        <span className={`dropdown-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="date-picker-dropdown">
          <div className="date-picker-header">
            <span>Select Date</span>
            {maxDaysBack === 2 && (
              <span className="date-limit-badge">Free: 2 days only</span>
            )}
          </div>
          <div className="date-picker-list">
            {availableDates.map((date) => (
              <button
                key={date}
                className={`date-option ${date === currentDate ? 'active' : ''}`}
                onClick={() => {
                  onDateSelect(date);
                  setIsOpen(false);
                }}
              >
                {formatDate(date)}
                {date === currentDate && <span className="current-indicator">← Current</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
