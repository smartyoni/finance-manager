export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
}

export interface VariableExpense {
  id: string;
  name: string;
  amount: number;
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
  amount: number;
  received: boolean;
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