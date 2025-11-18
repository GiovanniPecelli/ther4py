import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const toYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Calendar = ({ sessionDates, onDateClick, selectedDate }) => {
  // Use a function to safely parse the date string and avoid timezone issues
  const getSafeDate = (dateString) => {
    if (!dateString) return new Date();
    // By adding 'T00:00:00', we specify local time and avoid UTC conversion issues.
    return new Date(`${dateString}T00:00:00`);
  };

  const [currentDate, setCurrentDate] = useState(getSafeDate(selectedDate));

  // Update internal calendar month if selectedDate prop changes from outside
  useEffect(() => {
    setCurrentDate(getSafeDate(selectedDate));
  }, [selectedDate]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());
  const endDate = new Date(endOfMonth);
  if (endOfMonth.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));
  }

  const dates = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    dates.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const today = new Date();
  const safeSelectedDate = getSafeDate(selectedDate);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={prevMonth}><ChevronLeft size={20} /></button>
        <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={nextMonth}><ChevronRight size={20} /></button>
      </div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
        {dates.map((date, index) => {
          const dateStr = toYYYYMMDD(date);
          const hasSession = sessionDates.includes(dateStr);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isSelected = isSameDay(date, safeSelectedDate);
          const isToday = isSameDay(date, today);

          return (
            <div
              key={index}
              className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onDateClick(dateStr)}
            >
              <span>{date.getDate()}</span>
              {hasSession && <div className="session-indicator"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
