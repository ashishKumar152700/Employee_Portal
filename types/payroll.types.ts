export interface PayrollComponent {
  code: string;
  name: string;
  category: "earning" | "deduction";
  currentAmount: number;
  isTaxable?: boolean;
  isStatutory?: boolean;
}

export interface PayrollAttendance {
  calendarDays: number;
  payableDays: number;
  paidDays: number;
  lopDays: number;
}

export interface PayrollSummary {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}

export interface PayrollHistoryItem {
  id: number;
  payrollId: number;
  month: string;
  year: number;
  financialYear: string;
  status: "Draft" | "Calculated" | "Finalized";
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  attendance?: PayrollAttendance;
}

export interface PayrollDetail {
  id: number;
  payrollId: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  month: string;
  year: number;
  financialYear: string;
  status: "Draft" | "Calculated" | "Finalized";
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  attendance: PayrollAttendance;
  components: PayrollComponent[];
  taxDetails?: PayrollTaxDetail;
}

export interface PayrollTaxDetail {
  financialYear: string;
  assessmentYear: string;
  taxRegime: string;
  grossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  taxPayable: number;
  tds: number;
}

export interface PayslipData {
  payrollId: number;
  month: string;
  year: number;
  financialYear: string;
  employee: {
    id: number;
    employeeCode: string;
    name: string;
    designation: string;
    department: string;
    location: string;
    bank: string;
    pan: string;
  };
  attendance: PayrollAttendance;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
}

export interface TaxReport {
  employee: {
    id: number;
    employeeCode: string;
    name: string;
  };
  financialYear: string;
  assessmentYear: string;
  taxRegime: string;
  annualGrossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  totalTax: number;
  totalTds: number;
  monthlyRecords: TaxMonthlyRecord[];
}

export interface TaxMonthlyRecord {
  month: string;
  year: number;
  taxableIncome: number;
  tds: number;
  payrollId: number;
}

export interface PayrollResponse<T> {
  status: number;
  message?: string;
  data: T;
}

export interface PayrollApiError {
  message: string;
  status?: number;
}