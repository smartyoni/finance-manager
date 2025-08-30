import React, { useState } from 'react';

interface SidebarProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  savedMonths: string[];
  selectedYear: number;
  selectedMonth: number;
  onMonthSelect: (year: number, month: number) => void;
  onDeleteMonth: (year: number, month: number) => void;
  months: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  hasUnsavedChanges,
  onSave,
  savedMonths,
  selectedYear,
  selectedMonth,
  onMonthSelect,
  onDeleteMonth,
  months
}) => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([selectedYear]));

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const groupedMonths = savedMonths.reduce((acc, monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    if (!acc[year]) acc[year] = [];
    acc[year].push(month);
    return acc;
  }, {} as Record<number, number[]>);

  const years = Object.keys(groupedMonths).map(Number).sort((a, b) => b - a);

  const getMonthSummary = (year: number, month: number): string => {
    const key = `monthlyData-${year}-${month}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const income = parsed.income || 0;
        const totalExpenses = 
          (parsed.fixedExpenses?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0) +
          (parsed.variableExpenses?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0) +
          (parsed.taxes?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0) +
          (parsed.operationalExpenses?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0);
        const profit = income - totalExpenses;
        return `${profit >= 0 ? '+' : ''}${profit.toLocaleString()}원`;
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <div className="sidebar">
      <button
        className="save-button"
        onClick={onSave}
        disabled={!hasUnsavedChanges}
      >
        {hasUnsavedChanges ? '저장하기' : '저장됨'}
      </button>

      <h3>재무 데이터</h3>
      
      {years.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>저장된 데이터가 없습니다</p>
      ) : (
        years.map(year => (
          <div key={year} className="year-folder">
            <div 
              className="year-header"
              onClick={() => toggleYear(year)}
            >
              <span>{year}년</span>
              <span>{expandedYears.has(year) ? '▼' : '▶'}</span>
            </div>
            
            {expandedYears.has(year) && (
              <div className="year-content">
                {groupedMonths[year]
                  .sort((a, b) => b - a)
                  .map(month => (
                    <div
                      key={`${year}-${month}`}
                      className={`month-item ${
                        selectedYear === year && selectedMonth === month ? 'active' : ''
                      }`}
                    >
                      <div 
                        onClick={() => onMonthSelect(year, month)}
                        style={{ flex: 1, cursor: 'pointer' }}
                      >
                        <div>{months[month]}</div>
                        <div className="month-summary">
                          {getMonthSummary(year, month)}
                        </div>
                      </div>
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMonth(year, month);
                        }}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Sidebar;