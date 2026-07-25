'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Get total days in the previous month (for padding)
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (dayNum: number) => {
    return (
      dayNum === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Generate calendar grid array
  const calendarDays = [];

  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
    });
  }

  // Days of the current month
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
    });
  }

  // Padding days for next month to complete standard 6-row grid (42 cells)
  const totalCells = 42;
  const nextMonthPadding = totalCells - calendarDays.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 shadow-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-violet-500" />
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
        {DAY_NAMES.map((d) => (
          <div key={d} className={d === 'Min' ? 'text-red-500/80' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {calendarDays.map((cell, idx) => {
          const currentDayIsToday = cell.isCurrentMonth && isToday(cell.day);
          return (
            <div
              key={idx}
              className={`py-1.5 rounded-lg transition duration-150 relative ${
                cell.isCurrentMonth
                  ? currentDayIsToday
                    ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-500/20'
                    : 'text-slate-300 hover:bg-slate-800/50 cursor-pointer'
                  : 'text-slate-700'
              }`}
            >
              {cell.day}
              {currentDayIsToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
