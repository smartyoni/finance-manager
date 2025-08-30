import React, { useState, useMemo } from 'react';
import './App.css';
import { FixedExpense, VariableExpense, OperationalExpense, CommissionIncome, Tax, FixedExpenseTemplate } from './types';
import { useMonthlyData } from './hooks/useMonthlyData';
import Sidebar from './components/Sidebar';
import FixedExpenseTemplateModal from './components/FixedExpenseTemplateModal';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('fixed');
  const [fixedExpenseTemplates, setFixedExpenseTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const { monthlyData, setMonthlyData, saveData } = useMonthlyData(selectedYear, selectedMonth);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const totalCommissionIncome = monthlyData.commissionIncomes.reduce((sum, item) => sum + (item.actualAmount || item.commission || item.amount || 0), 0);

  const totalExpenses = 
    monthlyData.fixedExpenses.reduce((sum, item) => sum + item.amount, 0) +
    monthlyData.variableExpenses.reduce((sum, item) => sum + item.amount, 0) +
    monthlyData.taxes.reduce((sum, item) => sum + item.amount, 0) +
    monthlyData.operationalExpenses.reduce((sum, item) => sum + item.amount, 0);

  const profit = totalCommissionIncome - totalExpenses;

  const handleSave = () => {
    saveData(monthlyData);
    setHasUnsavedChanges(false);
    setRefreshSidebar(prev => prev + 1); // Sidebar 재렌더링 트리거
  };


  const updateCommissionIncome = (id: string, field: keyof CommissionIncome, value: any) => {
    const updatedData = {
      ...monthlyData,
      commissionIncomes: monthlyData.commissionIncomes.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const addCommissionIncome = (income: Omit<CommissionIncome, 'id'>) => {
    const newIncome = { ...income, id: Date.now().toString() };
    const updatedData = {
      ...monthlyData,
      commissionIncomes: [...monthlyData.commissionIncomes, newIncome]
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const deleteCommissionIncome = (id: string) => {
    const updatedData = {
      ...monthlyData,
      commissionIncomes: monthlyData.commissionIncomes.filter(item => item.id !== id)
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateFixedExpense = (id: string, field: 'amount' | 'paymentDate' | 'paid', value: number | string | boolean) => {
    const updatedData = {
      ...monthlyData,
      fixedExpenses: monthlyData.fixedExpenses.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  const updateVariableExpense = (id: string, field: 'amount' | 'paymentDate' | 'paid', value: number | string | boolean) => {
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

  const addTax = (tax: Omit<Tax, 'id'>) => {
    const newTax = { ...tax, id: Date.now().toString() };
    const updatedData = {
      ...monthlyData,
      taxes: [...monthlyData.taxes, newTax]
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  // 템플릿 관련 함수들
  const loadFixedExpenseTemplates = () => {
    const saved = localStorage.getItem('fixedExpenseTemplates');
    if (saved) {
      setFixedExpenseTemplates(JSON.parse(saved));
    }
  };

  const saveFixedExpenseTemplates = (templates: FixedExpenseTemplate[]) => {
    localStorage.setItem('fixedExpenseTemplates', JSON.stringify(templates));
    setFixedExpenseTemplates(templates);
  };

  const applyTemplateToMonth = () => {
    const activeTemplates = fixedExpenseTemplates.filter(template => template.active);
    const newFixedExpenses: FixedExpense[] = activeTemplates.map(template => ({
      id: Date.now().toString() + Math.random(),
      name: template.name,
      amount: template.amount,
      paymentDate: template.paymentDate,
      paid: false
    }));

    const updatedData = {
      ...monthlyData,
      fixedExpenses: [...monthlyData.fixedExpenses, ...newFixedExpenses]
    };
    setMonthlyData(updatedData);
    setHasUnsavedChanges(true);
  };

  // 컴포넌트 마운트시 템플릿 로드
  React.useEffect(() => {
    loadFixedExpenseTemplates();
  }, []);

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
    
    // 새로운 월을 선택했을 때, 해당 월에 고정지출 데이터가 없고 템플릿이 있다면 자동 적용 제안
    const monthKey = `monthlyData-${year}-${month}`;
    const existingData = localStorage.getItem(monthKey);
    
    if (!existingData && fixedExpenseTemplates.some(template => template.active)) {
      setTimeout(() => {
        if (window.confirm('새로운 월입니다. 고정지출 템플릿을 적용하시겠습니까?')) {
          applyTemplateToMonth();
        }
      }, 100);
    }
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
            { id: '1', name: '매매 중개수수료', roomName: '', balanceDate: '', deposit: 0, monthlyRent: 0, otherFees: 0, commission: 0, actualAmount: 0, propertyAddress: '', type: '단타' as '양타' | '단타', amount: 0, received: false, memo: '' },
            { id: '2', name: '임대 중개수수료', roomName: '', balanceDate: '', deposit: 0, monthlyRent: 0, otherFees: 0, commission: 0, actualAmount: 0, propertyAddress: '', type: '단타' as '양타' | '단타', amount: 0, received: false, memo: '' },
          ],
          fixedExpenses: [
            { id: '1', name: '월세', amount: 0, paymentDate: '', paid: false },
            { id: '2', name: '인터넷', amount: 0, paymentDate: '', paid: false },
            { id: '3', name: '인터넷전화', amount: 0, paymentDate: '', paid: false },
            { id: '4', name: '정수기', amount: 0, paymentDate: '', paid: false },
            { id: '5', name: '협회비', amount: 0, paymentDate: '', paid: false },
            { id: '6', name: '정보망사용료', amount: 0, paymentDate: '', paid: false },
          ],
          variableExpenses: [
            { id: '1', name: '원천세', amount: 0, paymentDate: '', paid: false },
            { id: '2', name: '지방세', amount: 0, paymentDate: '', paid: false },
            { id: '3', name: '건강보험', amount: 0, paymentDate: '', paid: false },
            { id: '4', name: '국민연금', amount: 0, paymentDate: '', paid: false },
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 className="page-title" style={{ margin: '0 0 8px 0' }}>💰 재무관리</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>사무실의 월별 수입과 지출을 체계적으로 관리하세요</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                  border: '1px solid #ffeaa7',
                  whiteSpace: 'nowrap'
                }}>
                  💾 저장되지 않은 변경사항이 있습니다
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="two-column-layout">
          {/* 수입 섹션 */}
          <div className="income-section-card">
            <div className="section-header">
              <h2 className="section-title">💰 중개수수료 관리</h2>
              <div className="section-total income">
                +{totalCommissionIncome.toLocaleString()} 원
              </div>
            </div>
            
            <CommissionIncomeTab 
              incomes={monthlyData.commissionIncomes}
              onUpdate={updateCommissionIncome}
              onAdd={addCommissionIncome}
              onDelete={deleteCommissionIncome}
            />
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
                  onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                  onApplyTemplate={applyTemplateToMonth}
                />
              )}
              {activeTab === 'variable' && (
                <VariableExpenseTab 
                  expenses={monthlyData.variableExpenses}
                  onUpdate={updateVariableExpense}
                />
              )}
              {activeTab === 'tax' && (
                <TaxTab 
                  taxes={monthlyData.taxes}
                  onAdd={addTax}
                />
              )}
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
              <div className="notion-summary-label">중개수수료 총액</div>
              <div className="notion-summary-amount income">
                +{totalCommissionIncome.toLocaleString()} 원
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
      
      <FixedExpenseTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={fixedExpenseTemplates}
        onUpdate={saveFixedExpenseTemplates}
      />
    </div>
  );
}

const CommissionIncomeTab: React.FC<{
  incomes: CommissionIncome[];
  onUpdate: (id: string, field: keyof CommissionIncome, value: any) => void;
  onAdd: (income: Omit<CommissionIncome, 'id'>) => void;
  onDelete: (id: string) => void;
}> = ({ incomes, onUpdate, onAdd, onDelete }) => {
  const [newIncome, setNewIncome] = useState({
    name: '중개수수료',
    roomName: '',
    balanceDate: '',
    deposit: 0,
    monthlyRent: 0,
    otherFees: 0,
    commission: 0,
    actualAmount: 0,
    propertyAddress: '',
    type: '단타' as '양타' | '단타',
    amount: 0,
    received: false,
    memo: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<CommissionIncome | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMemoPopup, setShowMemoPopup] = useState(false);
  const [memoIncome, setMemoIncome] = useState<CommissionIncome | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<CommissionIncome | null>(null);

  const calculateCommission = (deposit: number, monthlyRent: number, otherFees: number, type: '양타' | '단타') => {
    const baseCommission = ((monthlyRent * 100) + deposit) * 0.004;
    const finalCommission = type === '양타' ? baseCommission * 2 : baseCommission;
    return finalCommission + otherFees;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedCommission = calculateCommission(newIncome.deposit, newIncome.monthlyRent, newIncome.otherFees, newIncome.type);
    const incomeToAdd = {
      ...newIncome,
      commission: calculatedCommission,
      actualAmount: newIncome.actualAmount || calculatedCommission,
      amount: newIncome.actualAmount || calculatedCommission
    };
    onAdd(incomeToAdd);
    setNewIncome({
      name: '중개수수료',
      roomName: '',
      balanceDate: '',
      deposit: 0,
      monthlyRent: 0,
      otherFees: 0,
      commission: 0,
      actualAmount: 0,
      propertyAddress: '',
      type: '단타' as '양타' | '단타',
      amount: 0,
      received: false,
      memo: ''
    });
    setShowAddForm(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setNewIncome(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'deposit' || field === 'monthlyRent' || field === 'otherFees' || field === 'type') {
        const calculatedCommission = calculateCommission(updated.deposit, updated.monthlyRent, updated.otherFees, updated.type);
        updated.commission = calculatedCommission;
        updated.actualAmount = calculatedCommission; // 기본값을 계산된 금액으로 설정
        updated.amount = calculatedCommission;
      }
      if (field === 'actualAmount') {
        updated.amount = value; // 실제 수령 금액이 변경되면 amount도 업데이트
      }
      return updated;
    });
  };

  return (
    <div>
      {!showAddForm && (
        <button 
          className="add-income-button"
          onClick={() => setShowAddForm(true)}
          style={{
            backgroundColor: '#f8f9fa',
            border: '2px dashed #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            width: '100%',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          새 수입 항목 추가
        </button>
      )}

      {showAddForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px', fontWeight: '600' }}>새 중개수수료 등록</h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>호실명</label>
                <input
                  type="text"
                  placeholder="101호"
                  value={newIncome.roomName}
                  onChange={(e) => handleInputChange('roomName', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>잔금일</label>
                <input
                  type="date"
                  value={newIncome.balanceDate}
                  onChange={(e) => handleInputChange('balanceDate', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>선택</label>
                <select
                  value={newIncome.type}
                  onChange={(e) => handleInputChange('type', e.target.value as '양타' | '단타')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="단타">단타</option>
                  <option value="양타">양타</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>보증금</label>
                <input
                  type="text"
                  placeholder="0"
                  value={newIncome.deposit ? newIncome.deposit.toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(value)) && value !== '') {
                      handleInputChange('deposit', Number(value));
                    } else if (value === '') {
                      handleInputChange('deposit', 0);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>월차임</label>
                <input
                  type="text"
                  placeholder="0"
                  value={newIncome.monthlyRent ? newIncome.monthlyRent.toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(value)) && value !== '') {
                      handleInputChange('monthlyRent', Number(value));
                    } else if (value === '') {
                      handleInputChange('monthlyRent', 0);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>기타(청소비, 이사 수수료)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={newIncome.otherFees ? newIncome.otherFees.toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(value)) && value !== '') {
                      handleInputChange('otherFees', Number(value));
                    } else if (value === '') {
                      handleInputChange('otherFees', 0);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '16px', marginBottom: '16px', padding: '14px', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '2px solid #0277bd' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#01579b', marginBottom: '4px' }}>계산된 중개보수 (참고)</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#01579b' }}>₩{newIncome.commission.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#0277bd', marginTop: '4px' }}>
                계산식: ((월차임 × 100) + 보증금) × 0.4%{newIncome.type === '양타' && ' × 2'} + 기타
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>실제 수령 금액</label>
              <input
                type="text"
                placeholder="0"
                value={newIncome.actualAmount ? newIncome.actualAmount.toLocaleString() : newIncome.commission.toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value)) && value !== '') {
                    handleInputChange('actualAmount', Number(value));
                  } else if (value === '') {
                    handleInputChange('actualAmount', 0);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#f0fdf4'
                }}
              />
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                협의된 실제 수령 금액을 입력하세요. 기본값은 계산된 금액입니다.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewIncome({
                    name: '중개수수료',
                    roomName: '',
                    balanceDate: '',
                    deposit: 0,
                    monthlyRent: 0,
                    otherFees: 0,
                    commission: 0,
                    actualAmount: 0,
                    propertyAddress: '',
                    type: '단타' as '양타' | '단타',
                    amount: 0,
                    received: false,
                    memo: ''
                  });
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                등록
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          maxHeight: '360px', // 헤더 + 8개 행 높이
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <table className="notion-table" style={{ margin: 0, border: 'none' }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: '#f9fafb',
              zIndex: 10
            }}>
              <tr>
                <th style={{ width: '200px' }}>호실명</th>
                <th style={{ width: '120px' }}>잔금일</th>
                <th>중개보수</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {incomes
                .sort((a, b) => {
                  // 잔금일 오름차순 정렬 (빈 값은 맨 뒤로)
                  if (!a.balanceDate && !b.balanceDate) return 0;
                  if (!a.balanceDate) return 1;
                  if (!b.balanceDate) return -1;
                  return new Date(a.balanceDate).getTime() - new Date(b.balanceDate).getTime();
                })
                .map(income => (
                <tr 
                  key={income.id}
                  onClick={(e) => {
                    // 메모가 있으면 메모 팝업 표시
                    if (income.memo && income.memo.trim()) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopupPosition({
                        x: rect.left + rect.width / 2, // 항목 가운데 위치
                        y: rect.top - 10 // 항목 위쪽에 표시
                      });
                      setMemoIncome(income);
                      setShowMemoPopup(true);
                    }
                  }}
                  onDoubleClick={() => {
                    // 메모 팝업이 열린 상태면 먼저 닫기
                    if (showMemoPopup) {
                      setShowMemoPopup(false);
                      setMemoIncome(null);
                    }
                    setSelectedIncome(income);
                    setShowDetailModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ fontWeight: '500', color: income.received ? '#787774' : '#37352f', fontSize: '14px', width: '200px' }}>
                    {income.roomName || '-'}
                  </td>
                  <td style={{ fontSize: '14px', color: income.received ? '#787774' : '#37352f', width: '120px', whiteSpace: 'nowrap' }}>
                    {income.balanceDate || '-'}
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#10b981', fontSize: '14px' }}>
                      {income.actualAmount ? income.actualAmount.toLocaleString() : (income.commission || income.amount).toLocaleString()}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="notion-checkbox"
                      checked={income.received}
                      onChange={(e) => onUpdate(income.id, 'received', e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 합계 영역 */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderTop: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151'
          }}>
            중개보수 합계 ({incomes.length}건)
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>₩</span>
            <span>
              {incomes.reduce((sum, income) => {
                return sum + (income.actualAmount || income.commission || income.amount || 0);
              }, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* 상세 정보 모달 */}
      {showDetailModal && selectedIncome && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            setShowDetailModal(false);
            setSelectedIncome(null);
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 중단
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                {editMode ? '중개수수료 수정' : '중개수수료 상세 정보'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!editMode ? (
                  <>
                    {incomes.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm('이 중개수수료 항목을 삭제하시겠습니까?')) {
                            onDelete(selectedIncome.id);
                            setShowDetailModal(false);
                            setSelectedIncome(null);
                          }
                        }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setEditData({ ...selectedIncome });
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      수정
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (editData) {
                          // 수정된 데이터 저장
                          const calculatedCommission = calculateCommission(editData.deposit, editData.monthlyRent, editData.otherFees, editData.type);
                          const updatedData = {
                            ...editData,
                            commission: calculatedCommission,
                            actualAmount: editData.actualAmount || calculatedCommission,
                            amount: editData.actualAmount || calculatedCommission
                          };
                          
                          // 업데이트 함수 호출로 데이터 수정
                          onUpdate(editData.id, 'roomName', updatedData.roomName);
                          onUpdate(editData.id, 'balanceDate', updatedData.balanceDate);
                          onUpdate(editData.id, 'deposit', updatedData.deposit);
                          onUpdate(editData.id, 'monthlyRent', updatedData.monthlyRent);
                          onUpdate(editData.id, 'otherFees', updatedData.otherFees);
                          onUpdate(editData.id, 'type', updatedData.type);
                          onUpdate(editData.id, 'actualAmount', updatedData.actualAmount);
                          onUpdate(editData.id, 'received', updatedData.received);
                          onUpdate(editData.id, 'memo', updatedData.memo);
                          
                          setSelectedIncome(updatedData);
                          setEditMode(false);
                          setEditData(null);
                        }
                      }}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditData(null);
                      }}
                      style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedIncome(null);
                    setEditMode(false);
                    setEditData(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>호실명</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData?.roomName || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, roomName: e.target.value } : null)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                      {selectedIncome.roomName || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>잔금일</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editData?.balanceDate || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, balanceDate: e.target.value } : null)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}>
                      {selectedIncome.balanceDate || '-'}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>선택</label>
                  {editMode ? (
                    <select
                      value={editData?.type || '단타'}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, type: e.target.value as '양타' | '단타' } : null)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="단타">단타</option>
                      <option value="양타">양타</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: selectedIncome.type === '양타' ? '#dcfce7' : '#fef3c7',
                        color: selectedIncome.type === '양타' ? '#166534' : '#92400e',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {selectedIncome.type || '단타'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>수령 여부</label>
                  {editMode ? (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={editData?.received || false}
                        onChange={(e) => setEditData(prev => prev ? { ...prev, received: e.target.checked } : null)}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        {editData?.received ? '수령완료' : '미수령'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                      <span style={{
                        backgroundColor: selectedIncome.received ? '#dcfce7' : '#fee2e2',
                        color: selectedIncome.received ? '#166534' : '#dc2626',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {selectedIncome.received ? '수령완료' : '미수령'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>보증금</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData?.deposit ? editData.deposit.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(Number(value)) || value === '') {
                          setEditData(prev => prev ? { ...prev, deposit: value === '' ? 0 : Number(value) } : null);
                        }
                      }}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        textAlign: 'right',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', textAlign: 'right' }}>
                      ₩{selectedIncome.deposit ? selectedIncome.deposit.toLocaleString() : '0'}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>월차임</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData?.monthlyRent ? editData.monthlyRent.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(Number(value)) || value === '') {
                          setEditData(prev => prev ? { ...prev, monthlyRent: value === '' ? 0 : Number(value) } : null);
                        }
                      }}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        textAlign: 'right',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', textAlign: 'right' }}>
                      ₩{selectedIncome.monthlyRent ? selectedIncome.monthlyRent.toLocaleString() : '0'}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>기타(청소비, 이사 수수료)</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData?.otherFees ? editData.otherFees.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(Number(value)) || value === '') {
                          setEditData(prev => prev ? { ...prev, otherFees: value === '' ? 0 : Number(value) } : null);
                        }
                      }}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        textAlign: 'right',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', textAlign: 'right' }}>
                      ₩{selectedIncome.otherFees ? selectedIncome.otherFees.toLocaleString() : '0'}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>계산된 중개보수</label>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f0fdf4', 
                  border: '2px solid #22c55e', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#15803d' }}>
                    ₩{selectedIncome.commission ? selectedIncome.commission.toLocaleString() : selectedIncome.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                    계산식: ((월차임 × 100) + 보증금) × 0.4%{selectedIncome.type === '양타' && ' × 2'} + 기타
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>실제 수령 금액</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editData?.actualAmount ? editData.actualAmount.toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(value)) || value === '') {
                        setEditData(prev => prev ? { ...prev, actualAmount: value === '' ? 0 : Number(value) } : null);
                      }
                    }}
                    placeholder="협의된 실제 수령 금액"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      outline: 'none',
                      textAlign: 'center',
                      backgroundColor: '#f0fdf4',
                      boxSizing: 'border-box'
                    }}
                  />
                ) : (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#eff6ff', 
                    border: '2px solid #3b82f6', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#1d4ed8' }}>
                      ₩{selectedIncome.actualAmount ? selectedIncome.actualAmount.toLocaleString() : (selectedIncome.commission || selectedIncome.amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px' }}>
                      {selectedIncome.actualAmount && selectedIncome.actualAmount !== (selectedIncome.commission || selectedIncome.amount) 
                        ? '협의된 실제 수령 금액' 
                        : '계산된 금액과 동일'}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>메모</label>
                <textarea
                  value={editMode ? (editData?.memo || '') : (selectedIncome.memo || '')}
                  onChange={(e) => {
                    if (editMode && editData) {
                      setEditData(prev => prev ? { ...prev, memo: e.target.value } : null);
                    } else {
                      const updatedIncome = { ...selectedIncome, memo: e.target.value };
                      setSelectedIncome(updatedIncome);
                      // 실시간으로 메모 업데이트
                      onUpdate(selectedIncome.id, 'memo', e.target.value);
                    }
                  }}
                  placeholder="메모를 입력하세요..."
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '12px',
                    border: editMode ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: editMode ? '#ffffff' : '#f9fafb'
                  }}
                  readOnly={!editMode}
                  onFocus={(e) => {
                    if (!editMode) return;
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    if (!editMode) return;
                    e.target.style.borderColor = '#3b82f6';
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedIncome(null);
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 메모 간단 팝업 */}
      {showMemoPopup && memoIncome && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000
          }}
          onClick={() => {
            setShowMemoPopup(false);
            setMemoIncome(null);
          }}
        >
          <div 
            style={{
              position: 'absolute',
              left: popupPosition.x,
              top: popupPosition.y,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              width: '320px',
              maxHeight: '250px',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()} // 팝업 내부 클릭 시 이벤트 전파 중단
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '15px', fontWeight: '600' }}>
                📝 {memoIncome.roomName || '중개수수료'} 메모
              </h3>
              <button
                onClick={() => {
                  setShowMemoPopup(false);
                  setMemoIncome(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              padding: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: '1.4',
              color: '#374151',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '120px',
              overflow: 'auto'
            }}>
              {memoIncome.memo || '메모가 없습니다.'}
            </div>
            
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowMemoPopup(false);
                  setMemoIncome(null);
                  // 더블클릭 상세 모달 열기
                  setSelectedIncome(memoIncome);
                  setShowDetailModal(true);
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginRight: '6px'
                }}
              >
                상세보기
              </button>
              <button
                onClick={() => {
                  setShowMemoPopup(false);
                  setMemoIncome(null);
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FixedExpenseTab: React.FC<{
  expenses: FixedExpense[];
  onUpdate: (id: string, field: 'amount' | 'paymentDate' | 'paid', value: number | string | boolean) => void;
  onOpenTemplateModal?: () => void;
  onApplyTemplate?: () => void;
}> = ({ expenses, onUpdate, onOpenTemplateModal, onApplyTemplate }) => (
  <div>
    <div className="template-controls" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
      <button 
        onClick={onOpenTemplateModal}
        className="add-button"
        style={{ fontSize: '14px' }}
      >
        ⚙️ 템플릿 관리
      </button>
      <button 
        onClick={onApplyTemplate}
        className="save-button"
        style={{ fontSize: '14px' }}
      >
        📋 템플릿 적용
      </button>
    </div>
    <div className="notion-table-container">
      <table className="notion-table">
      <thead>
        <tr>
          <th>항목</th>
          <th style={{ width: '150px' }}>금액</th>
          <th style={{ width: '120px' }}>입금일</th>
          <th style={{ width: '40px' }}>지불</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map(expense => (
          <tr key={expense.id}>
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
            <td>
              <input
                type="date"
                className="notion-input-small"
                value={expense.paymentDate}
                onChange={(e) => onUpdate(expense.id, 'paymentDate', e.target.value)}
                style={{ width: '100%' }}
              />
            </td>
            <td style={{ textAlign: 'center' }}>
              <input
                type="checkbox"
                className="notion-checkbox"
                checked={expense.paid}
                onChange={(e) => onUpdate(expense.id, 'paid', e.target.checked)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  </div>
);

const VariableExpenseTab: React.FC<{
  expenses: VariableExpense[];
  onUpdate: (id: string, field: 'amount' | 'paymentDate' | 'paid', value: number | string | boolean) => void;
}> = ({ expenses, onUpdate }) => (
  <div className="notion-table-container">
    <table className="notion-table">
      <thead>
        <tr>
          <th>항목</th>
          <th style={{ width: '150px' }}>금액</th>
          <th style={{ width: '120px' }}>입금일</th>
          <th style={{ width: '40px' }}>지불</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map(expense => (
          <tr key={expense.id}>
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
            <td>
              <input
                type="date"
                className="notion-input-small"
                value={expense.paymentDate}
                onChange={(e) => onUpdate(expense.id, 'paymentDate', e.target.value)}
                style={{ width: '100%' }}
              />
            </td>
            <td style={{ textAlign: 'center' }}>
              <input
                type="checkbox"
                className="notion-checkbox"
                checked={expense.paid}
                onChange={(e) => onUpdate(expense.id, 'paid', e.target.checked)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TaxTab: React.FC<{
  taxes: Tax[];
  onAdd: (tax: Omit<Tax, 'id'>) => void;
}> = ({ taxes, onAdd }) => {
  const [newTax, setNewTax] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: 0,
    category: '부가세'
  });

  const taxCategories = ['부가세', '종소세', '지방세', '법인세', '소득세', '기타'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: newTax.name,
      amount: newTax.amount,
      year: new Date().getFullYear(),
      paid: false
    });
    setNewTax({
      date: new Date().toISOString().split('T')[0],
      name: '',
      amount: 0,
      category: '부가세'
    });
  };

  return (
    <div>
      <form className="operational-form" onSubmit={handleSubmit}>
        <input
          type="date"
          value={newTax.date}
          onChange={(e) => setNewTax(prev => ({ ...prev, date: e.target.value }))}
        />
        <select
          value={newTax.category}
          onChange={(e) => setNewTax(prev => ({ ...prev, category: e.target.value }))}
        >
          {taxCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="세목"
          value={newTax.name}
          onChange={(e) => setNewTax(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="금액"
          value={newTax.amount ? newTax.amount.toLocaleString() : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, '');
            if (!isNaN(Number(value)) && value !== '') {
              setNewTax(prev => ({ ...prev, amount: Number(value) }));
            } else if (value === '') {
              setNewTax(prev => ({ ...prev, amount: 0 }));
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
            <th>세목</th>
            <th>세목명</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {taxes.map(tax => (
            <tr key={tax.id}>
              <td>{new Date().toISOString().split('T')[0]}</td>
              <td>세금</td>
              <td>{tax.name}</td>
              <td>{tax.amount.toLocaleString()} 원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
            <th>세목</th>
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