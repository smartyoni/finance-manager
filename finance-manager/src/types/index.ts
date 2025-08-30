export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  paymentDate: string;
  paid: boolean;
}

export interface FixedExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  paymentDate: string;
  active: boolean;
}

export interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  paymentDate: string;
  paid: boolean;
}

export interface Tax {
  id: string;
  name: string;
  amount: number;
  year: number;
  quarter?: number;
  paid: boolean;
}

export interface OperationalExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface CommissionIncome {
  id: string;
  name: string;
  roomName: string;
  balanceDate: string;
  deposit: number;
  monthlyRent: number;
  otherFees: number;
  commission: number;
  actualAmount: number;
  propertyAddress: string;
  type: '양타' | '단타';
  amount: number;
  received: boolean;
  memo: string;
}

export interface MonthlyData {
  id: string;
  year: number;
  month: number;
  income: number;
  commissionIncomes: CommissionIncome[];
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  taxes: Tax[];
  operationalExpenses: OperationalExpense[];
}