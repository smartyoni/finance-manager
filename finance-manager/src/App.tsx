import React, { useState, useMemo } from 'react';
import './App.css';
import { FixedExpense, VariableExpense, OperationalExpense, CommissionIncome } from './types';
import { useMonthlyData } from './hooks/useMonthlyData';
import Sidebar from './components/Sidebar';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('fixed');
  const { monthlyData, setMonthlyData, saveData } = useMonthlyData(selectedYear, selectedMonth);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const totalCommissionIncome = monthlyData.commissionIncomes.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = monthlyData.income + totalCommissionIncome;

  const totalExpenses = 
    monthlyData.fixedExpenses.reduce((sum, item) => sum + item.amount, 0) +
    monthlyData.variableExpenses.reduce((sum, item) => sum + item.amount, 0) +
    monthlyData.taxes.reduce((sum, item) => sum + item.amount, 0) +
    monthlyData.operationalExpenses.reduce((sum, item) => sum + item.amount, 0);

  const profit = totalIncome - totalExpenses;

  const handleSave = () => {
    saveData(monthlyData);
    setHasUnsavedChanges(false);
    setRefreshSidebar(prev => prev + 1); // Sidebar 재렌더링 트리거
  };

  const updateIncome = (income: number) => {
    const updatedData = { ...monthlyData, income };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateCommissionIncome = (id: string, field: 'amount' | 'received', value: number | boolean) => {
    const updatedData = {
      ...monthlyData,
      commissionIncomes: monthlyData.commissionIncomes.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateFixedExpense = (id: string, field: 'amount' | 'paid', value: number | boolean) => {
    const updatedData = {
      ...monthlyData,
      fixedExpenses: monthlyData.fixedExpenses.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateVariableExpense = (id: string, field: 'amount' | 'paid', value: number | boolean) => {
    const updatedData = {
      ...monthlyData,
      variableExpenses: monthlyData.variableExpenses.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const addOperationalExpense = (expense: Omit<OperationalExpense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    const updatedData = {
      ...monthlyData,
      operationalExpenses: [...monthlyData.operationalExpenses, newExpense]
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const getAllSavedMonths = (): string[] => {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('monthlyData-'))
      .map(key => key.replace('monthlyData-', ''))
      .sort((a, b) => b.localeCompare(a));
  };

  // refreshSidebar 상태를 참조하여 savedMonths를 재계산
  const savedMonths = useMemo(() => getAllSavedMonths(), [refreshSidebar]);

  const handleMonthSelect = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setHasUnsavedChanges(false);
  };

  const handleDeleteMonth = (year: number, month: number) => {
    if (window.confirm(`${year}년 ${months[month]} 데이터를 삭제하시겠습니까?`)) {
      localStorage.removeItem(`monthlyData-${year}-${month}`);
      
      // 삭제된 데이터가 현재 선택된 월인 경우 데이터를 리셋
      if (selectedYear === year && selectedMonth === month) {
        setMonthlyData({
          id: `${year}-${month}`,
          year,
          month,
          income: 0,
          commissionIncomes: [
            { id: '1', name: '매매 중개수수료', amount: 0, received: false },
            { id: '2', name: '임대 중개수수료', amount: 0, received: false },
          ],
          fixedExpenses: [
            { id: '1', name: '월세', amount: 0, paid: false },
            { id: '2', name: '인터넷', amount: 0, paid: false },
            { id: '3', name: '인터넷전화', amount: 0, paid: false },
            { id: '4', name: '정수기', amount: 0, paid: false },
            { id: '5', name: '협회비', amount: 0, paid: false },
            { id: '6', name: '정보망사용료', amount: 0, paid: false },
          ],
          variableExpenses: [
            { id: '1', name: '원천세', amount: 0, paid: false },
            { id: '2', name: '지방세', amount: 0, paid: false },
            { id: '3', name: '건강보험', amount: 0, paid: false },
            { id: '4', name: '국민연금', amount: 0, paid: false },
          ],
          taxes: [],
          operationalExpenses: []
        });
        setHasUnsavedChanges(false);
      }
      
      setRefreshSidebar(prev => prev + 1); // Sidebar 재렌더링 트리거
    }
  };

  return (
    <div className="App">
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">💰 재무관리</h1>
          <p className="page-subtitle">사무실의 월별 수입과 지출을 체계적으로 관리하세요</p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div className="month-navigator">
              <button 
                className="nav-button"
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedYear(selectedYear - 1);
                    setSelectedMonth(11);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                  setHasUnsavedChanges(false);
                }}
              >
                ←
              </button>
              <div className="current-month">
                <span className="month-year">{selectedYear}년 {months[selectedMonth]}</span>
                <span className="month-subtitle">재무 현황</span>
              </div>
              <button 
                className="nav-button"
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedYear(selectedYear + 1);
                    setSelectedMonth(0);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                  setHasUnsavedChanges(false);
                }}
              >
                →
              </button>
            </div>
            {hasUnsavedChanges && (
              <div style={{ 
                backgroundColor: '#fef3cd', 
                color: '#856404', 
                padding: '8px 12px', 
                borderRadius: '6px', 
                fontSize: '14px',
                border: '1px solid #ffeaa7'
              }}>
                💾 저장되지 않은 변경사항이 있습니다
              </div>
            )}
          </div>
        </div>

        <div className="two-column-layout">
          {/* 수입 섹션 */}
          <div className="income-section-card">
            <div className="section-header">
              <h2 className="section-title">💰 수입 관리</h2>
              <div className="section-total income">
                +{totalIncome.toLocaleString()} 원
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#37352f', margin: '0 0 12px 0' }}>
                기본 수입
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  className="notion-input"
                  value={monthlyData.income ? monthlyData.income.toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(value)) && value !== '') {
                      updateIncome(Number(value));
                    } else if (value === '') {
                      updateIncome(0);
                    }
                  }}
                  placeholder="0"
                />
                <span style={{ color: '#787774', fontSize: '16px' }}>원</span>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#37352f', margin: '0 0 12px 0' }}>
                중개수수료
              </h3>
              <CommissionIncomeTab 
                incomes={monthlyData.commissionIncomes}
                onUpdate={updateCommissionIncome}
              />
            </div>
          </div>

          {/* 지출 섹션 */}
          <div className="expense-section-card">
            <div className="section-header">
              <h2 className="section-title">📊 지출 관리</h2>
              <div className="section-total expense">
                -{totalExpenses.toLocaleString()} 원
              </div>
            </div>
            
            <div className="notion-tabs">
              <button 
                className={`notion-tab ${activeTab === 'fixed' ? 'active' : ''}`}
                onClick={() => setActiveTab('fixed')}
              >
                🏠 고정지출
              </button>
              <button 
                className={`notion-tab ${activeTab === 'variable' ? 'active' : ''}`}
                onClick={() => setActiveTab('variable')}
              >
                📈 변동지출
              </button>
              <button 
                className={`notion-tab ${activeTab === 'tax' ? 'active' : ''}`}
                onClick={() => setActiveTab('tax')}
              >
                🏛️ 정기세금
              </button>
              <button 
                className={`notion-tab ${activeTab === 'operational' ? 'active' : ''}`}
                onClick={() => setActiveTab('operational')}
              >
                💼 운영비
              </button>
            </div>

            <div className="notion-tab-content">
              {activeTab === 'fixed' && (
                <FixedExpenseTab 
                  expenses={monthlyData.fixedExpenses}
                  onUpdate={updateFixedExpense}
                />
              )}
              {activeTab === 'variable' && (
                <VariableExpenseTab 
                  expenses={monthlyData.variableExpenses}
                  onUpdate={updateVariableExpense}
                />
              )}
              {activeTab === 'tax' && <TaxTab />}
              {activeTab === 'operational' && (
                <OperationalExpenseTab 
                  expenses={monthlyData.operationalExpenses}
                  onAdd={addOperationalExpense}
                />
              )}
            </div>
          </div>
        </div>

        <div className="notion-card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#37352f', margin: '0 0 20px 0' }}>
            📈 월별 요약
          </h2>
          <div className="notion-summary-grid">
            <div className="notion-summary-item">
              <div className="notion-summary-label">총 수입</div>
              <div className="notion-summary-amount income">
                +{totalIncome.toLocaleString()} 원
              </div>
            </div>
            <div className="notion-summary-item">
              <div className="notion-summary-label">총 지출</div>
              <div className="notion-summary-amount expense">
                -{totalExpenses.toLocaleString()} 원
              </div>
            </div>
            <div className="notion-summary-item">
              <div className="notion-summary-label">순손익</div>
              <div className={`notion-summary-amount ${profit >= 0 ? 'profit' : 'loss'}`}>
                {profit >= 0 ? '+' : ''}{profit.toLocaleString()} 원
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Sidebar
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        savedMonths={savedMonths}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onMonthSelect={handleMonthSelect}
        onDeleteMonth={handleDeleteMonth}
        months={months}
      />
    </div>
  );
}

const CommissionIncomeTab: React.FC<{
  incomes: CommissionIncome[];
  onUpdate: (id: string, field: 'amount' | 'received', value: number | boolean) => void;
}> = ({ incomes, onUpdate }) => (
  <div className="notion-table-container">
    <table className="notion-table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}></th>
          <th>항목</th>
          <th style={{ width: '150px' }}>금액</th>
        </tr>
      </thead>
      <tbody>
        {incomes.map(income => (
          <tr key={income.id}>
            <td>
              <input
                type="checkbox"
                className="notion-checkbox"
                checked={income.received}
                onChange={(e) => onUpdate(income.id, 'received', e.target.checked)}
              />
            </td>
            <td style={{ fontWeight: '500', color: income.received ? '#787774' : '#37352f' }}>
              {income.name}
            </td>
            <td>
              <input
                type="text"
                className="notion-input-small"
                value={income.amount ? income.amount.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value)) && value !== '') {
                    onUpdate(income.id, 'amount', Number(value));
                  } else if (value === '') {
                    onUpdate(income.id, 'amount', 0);
                  }
                }}
                placeholder="0"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FixedExpenseTab: React.FC<{
  expenses: FixedExpense[];
  onUpdate: (id: string, field: 'amount' | 'paid', value: number | boolean) => void;
}> = ({ expenses, onUpdate }) => (
  <div className="notion-table-container">
    <table className="notion-table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}></th>
          <th>항목</th>
          <th style={{ width: '150px' }}>금액</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map(expense => (
          <tr key={expense.id}>
            <td>
              <input
                type="checkbox"
                className="notion-checkbox"
                checked={expense.paid}
                onChange={(e) => onUpdate(expense.id, 'paid', e.target.checked)}
              />
            </td>
            <td style={{ fontWeight: '500', color: expense.paid ? '#787774' : '#37352f' }}>
              {expense.name}
            </td>
            <td>
              <input
                type="text"
                className="notion-input-small"
                value={expense.amount ? expense.amount.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value)) && value !== '') {
                    onUpdate(expense.id, 'amount', Number(value));
                  } else if (value === '') {
                    onUpdate(expense.id, 'amount', 0);
                  }
                }}
                placeholder="0"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const VariableExpenseTab: React.FC<{
  expenses: VariableExpense[];
  onUpdate: (id: string, field: 'amount' | 'paid', value: number | boolean) => void;
}> = ({ expenses, onUpdate }) => (
  <div className="notion-table-container">
    <table className="notion-table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}></th>
          <th>항목</th>
          <th style={{ width: '150px' }}>금액</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map(expense => (
          <tr key={expense.id}>
            <td>
              <input
                type="checkbox"
                className="notion-checkbox"
                checked={expense.paid}
                onChange={(e) => onUpdate(expense.id, 'paid', e.target.checked)}
              />
            </td>
            <td style={{ fontWeight: '500', color: expense.paid ? '#787774' : '#37352f' }}>
              {expense.name}
            </td>
            <td>
              <input
                type="text"
                className="notion-input-small"
                value={expense.amount ? expense.amount.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value)) && value !== '') {
                    onUpdate(expense.id, 'amount', Number(value));
                  } else if (value === '') {
                    onUpdate(expense.id, 'amount', 0);
                  }
                }}
                placeholder="0"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TaxTab: React.FC = () => (
  <div>
    <p>부가가치세, 종합소득세 관리 기능은 추후 추가 예정입니다.</p>
  </div>
);

const OperationalExpenseTab: React.FC<{
  expenses: OperationalExpense[];
  onAdd: (expense: Omit<OperationalExpense, 'id'>) => void;
}> = ({ expenses, onAdd }) => {
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: '비품구입'
  });

  const categories = ['비품구입', '광고비', '유지보수', '기타'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newExpense);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      category: '비품구입'
    });
  };

  return (
    <div>
      <form className="operational-form" onSubmit={handleSubmit}>
        <input
          type="date"
          value={newExpense.date}
          onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
        />
        <select
          value={newExpense.category}
          onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="내용"
          value={newExpense.description}
          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="금액"
          value={newExpense.amount ? newExpense.amount.toLocaleString() : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, '');
            if (!isNaN(Number(value)) && value !== '') {
              setNewExpense(prev => ({ ...prev, amount: Number(value) }));
            } else if (value === '') {
              setNewExpense(prev => ({ ...prev, amount: 0 }));
            }
          }}
          required
        />
        <button type="submit" className="add-button">추가</button>
      </form>
      
      <table className="operational-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>카테고리</th>
            <th>내용</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td>{expense.date}</td>
              <td>{expense.category}</td>
              <td>{expense.description}</td>
              <td>{expense.amount.toLocaleString()} 원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;