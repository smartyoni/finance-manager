import { useState, useEffect } from 'react';
import { MonthlyData } from '../types';

const createEmptyMonthlyData = (year: number, month: number): MonthlyData => ({
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

export const useMonthlyData = (year: number, month: number) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData>(createEmptyMonthlyData(year, month));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = () => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem(`monthlyData-${year}-${month}`);
      if (savedData) {
        setMonthlyData(JSON.parse(savedData));
      } else {
        setMonthlyData(createEmptyMonthlyData(year, month));
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setMonthlyData(createEmptyMonthlyData(year, month));
    } finally {
      setLoading(false);
    }
  };

  const saveData = (data: MonthlyData) => {
    try {
      localStorage.setItem(`monthlyData-${data.year}-${data.month}`, JSON.stringify(data));
      setMonthlyData(data);
      console.log('데이터 저장 완료');
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
  };

  const getAllSavedMonths = (): string[] => {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('monthlyData-'))
      .map(key => key.replace('monthlyData-', ''))
      .sort((a, b) => b.localeCompare(a));
  };

  return { monthlyData, setMonthlyData, saveData, loading, getAllSavedMonths };
};