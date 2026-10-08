import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";
import {
  PayrollHistoryItem,
  PayrollDetail,
  PayslipData,
  TaxReport,
  PayrollTaxDetail,
  PayrollComponent,
  PayrollAttendance,
} from "../../types/payroll.types";

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found. Please log in again.");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

interface EmployeeRecord {
  id: number;
  employeeNumber: string;
  displayName?: string;
}

const payrollEmployeeIdCache: Record<string, number> = {};
const payrollEmployeeIdInFlight: Record<string, Promise<number>> = {};

async function getLoggedinIdentity(): Promise<{
  userId?: number;
  employeeCode: string;
}> {
  const userJson = await AsyncStorage.getItem("user");
  if (!userJson) {
    throw new Error("User details not found. Please log in again.");
  }
  const user = JSON.parse(userJson) || {};
  const employeeCode =
    user.employeecode !== undefined && user.employeecode !== null
      ? String(user.employeecode).trim()
      : "";
  if (!employeeCode) {
    throw new Error("Employee code not available for the logged-in user.");
  }
  return { userId: user.id, employeeCode };
}

async function fetchPayrollEmployeeId(
  employeeCode: string
): Promise<number> {
  const headers = await getAuthHeaders();
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axios.get(`${baseUrl}/api/v1/employees/get`, {
      headers,
      params: { page, limit: pageSize },
    });

    const payload = response.data?.data || {};
    const list: EmployeeRecord[] = Array.isArray(payload.list)
      ? payload.list
      : [];

    const match = list.find(
      (employee) =>
        employee &&
        employee.employeeNumber !== undefined &&
        employee.employeeNumber !== null &&
        String(employee.employeeNumber).trim() === employeeCode
    );

    if (match) {
      const payrollEmployeeId = Number(match.id);
      if (Number.isInteger(payrollEmployeeId) && payrollEmployeeId > 0) {
        return payrollEmployeeId;
      }
    }

    totalPages =
      Number(payload.pagination?.totalPages) > 0
        ? Number(payload.pagination.totalPages)
        : page;
    page += 1;
  } while (page <= totalPages && page <= 100);

  throw new Error(
    `Payroll employee record not found for employee code ${employeeCode}.`
  );
}

export async function getPayrollEmployeeId(): Promise<number> {
  const { userId, employeeCode } = await getLoggedinIdentity();
  const cacheKey = `${userId !== undefined ? userId : "unknown"}:${employeeCode}`;

  const cached = payrollEmployeeIdCache[cacheKey];
  if (cached) {
    return cached;
  }

  if (!payrollEmployeeIdInFlight[cacheKey]) {
    payrollEmployeeIdInFlight[cacheKey] = fetchPayrollEmployeeId(employeeCode)
      .then((payrollEmployeeId) => {
        payrollEmployeeIdCache[cacheKey] = payrollEmployeeId;
        return payrollEmployeeId;
      })
      .finally(() => {
        delete payrollEmployeeIdInFlight[cacheKey];
      });
  }

  return payrollEmployeeIdInFlight[cacheKey];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toNumber = (value: any, fallback = 0): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: any, fallback = ""): string =>
  value === null || value === undefined ? fallback : String(value);

const toMonthName = (month: any): string => {
  const monthNumber = Number(month);
  if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return MONTH_NAMES[monthNumber - 1];
  }
  return "";
};

const toStatus = (value: any): "Draft" | "Calculated" | "Finalized" => {
  if (value === "Calculated" || value === "Finalized") return value;
  return "Draft";
};

const toComponent = (
  component: any,
  category: "earning" | "deduction"
): PayrollComponent => ({
  code: toText(component?.code),
  name: toText(component?.name, toText(component?.code)),
  category,
  currentAmount: toNumber(component?.currentAmount),
  isTaxable: Boolean(component?.isTaxable),
  isStatutory: Boolean(component?.isStatutory),
});

const toAttendance = (attendance: any): PayrollAttendance => {
  const calendarDays = toNumber(attendance?.calendarDays);
  const payableDays = toNumber(attendance?.payableDays);
  const lopDays = toNumber(attendance?.lopDays);
  const paidDays =
    attendance?.paidDays !== null && attendance?.paidDays !== undefined
      ? toNumber(attendance.paidDays)
      : calendarDays > 0
      ? calendarDays - lopDays
      : payableDays;
  return { calendarDays, payableDays, paidDays, lopDays };
};

const toTaxDetail = (tax: any): PayrollTaxDetail => {
  const tds =
    tax?.tds !== null && tax?.tds !== undefined
      ? toNumber(tax.tds)
      : toNumber(tax?.tdsTillLastMonth) + toNumber(tax?.tdsCurrentMonth);
  return {
    financialYear: toText(tax?.financialYear),
    assessmentYear: toText(tax?.assessmentYear),
    taxRegime: toText(tax?.taxRegime),
    grossIncome: toNumber(tax?.grossIncome ?? tax?.grossSalary),
    standardDeduction: toNumber(tax?.standardDeduction),
    taxableIncome: toNumber(tax?.taxableIncome),
    taxPayable: toNumber(
      tax?.taxPayable ?? tax?.totalTaxLiability ?? tax?.taxPayableRefundable
    ),
    tds,
  };
};

const toHistoryItem = (item: any): PayrollHistoryItem => {
  const payrollId = toNumber(item?.payrollId);
  return {
    id: payrollId,
    payrollId,
    month: toMonthName(item?.monthNumber ?? item?.payrollMonth),
    year: toNumber(item?.payrollYear ?? item?.year),
    financialYear: toText(item?.financialYear),
    status: toStatus(item?.status),
    grossSalary: toNumber(item?.grossSalary),
    totalDeductions: toNumber(item?.totalDeductions),
    netSalary: toNumber(item?.netSalary),
    attendance: toAttendance(item),
  };
};

const toPayrollDetail = (detail: any): PayrollDetail => {
  const payrollId = toNumber(detail?.payrollId);
  const period = detail?.payrollPeriod || {};
  const salary = detail?.salary || {};
  const employee = detail?.employee || {};
  const components: PayrollComponent[] = [
    ...(Array.isArray(detail?.earnings) ? detail.earnings : []).map(
      (component: any) => toComponent(component, "earning")
    ),
    ...(Array.isArray(detail?.deductions) ? detail.deductions : []).map(
      (component: any) => toComponent(component, "deduction")
    ),
  ];
  return {
    id: payrollId,
    payrollId,
    employeeId: toNumber(employee?.id ?? detail?.employeeId),
    employeeCode: toText(employee?.employeeCode),
    employeeName: toText(employee?.employeeName),
    month: toMonthName(period?.monthNumber ?? period?.payrollMonth),
    year: toNumber(period?.payrollYear ?? period?.year),
    financialYear: toText(period?.financialYear),
    status: toStatus(detail?.lifecycle?.status ?? detail?.status),
    grossSalary: toNumber(salary?.grossSalary ?? detail?.grossSalary),
    totalDeductions: toNumber(
      salary?.totalDeductions ?? detail?.totalDeductions
    ),
    netSalary: toNumber(salary?.netSalary ?? detail?.netSalary),
    attendance: toAttendance(detail?.attendance),
    components,
    taxDetails: detail?.taxDetails ? toTaxDetail(detail.taxDetails) : undefined,
  };
};

const toPayslipData = (payslip: any): PayslipData => {
  const payroll = payslip?.payroll || {};
  const employee = payslip?.employee || {};
  const bankingInfo = employee?.bankingInfo || {};
  const bankParts = [bankingInfo.bankName, bankingInfo.accountNumber].filter(
    (part) => part !== null && part !== undefined && String(part).trim() !== ""
  );
  return {
    payrollId: toNumber(payroll?.id ?? payslip?.payrollId),
    month: toMonthName(payroll?.month ?? payroll?.monthNumber),
    year: toNumber(payroll?.year ?? payroll?.payrollYear),
    financialYear: toText(payroll?.financialYear),
    employee: {
      id: toNumber(employee?.id),
      employeeCode: toText(
        employee?.employeeCode ?? employee?.employeeNumber
      ),
      name: toText(employee?.name ?? employee?.displayName),
      designation: toText(employee?.designation),
      department: toText(employee?.department),
      location: toText(employee?.location),
      bank: bankParts.join(" • "),
      pan: toText(employee?.pan),
    },
    attendance: toAttendance(payslip?.attendance),
    earnings: (
      Array.isArray(payslip?.earnings) ? payslip.earnings : []
    ).map((component: any) => toComponent(component, "earning")),
    deductions: (
      Array.isArray(payslip?.deductions) ? payslip.deductions : []
    ).map((component: any) => toComponent(component, "deduction")),
    grossEarnings: toNumber(
      payslip?.grossEarnings ?? payslip?.totals?.totalEarnings
    ),
    totalDeductions: toNumber(
      payslip?.totalDeductions ?? payslip?.totals?.totalDeductions
    ),
    netSalary: toNumber(payslip?.netSalary ?? payslip?.totals?.netSalary),
  };
};

const toTaxReport = (report: any): TaxReport => {
  const employee = report?.employee || {};
  const totals = report?.totals || {};
  const monthlyReport = Array.isArray(report?.monthlyReport)
    ? report.monthlyReport
    : [];
  return {
    employee: {
      id: toNumber(employee?.id),
      employeeCode: toText(
        employee?.employeeNumber ?? employee?.employeeCode
      ),
      name: toText(employee?.displayName ?? employee?.name),
    },
    financialYear: toText(report?.financialYear),
    assessmentYear: toText(report?.assessmentYear),
    taxRegime: toText(report?.taxRegime),
    annualGrossIncome: toNumber(
      report?.annualGrossIncome ?? totals?.totalGross
    ),
    standardDeduction: toNumber(
      report?.standardDeduction ?? totals?.standardDeduction
    ),
    taxableIncome: toNumber(report?.taxableIncome ?? totals?.taxableIncome),
    totalTax: toNumber(report?.totalTax ?? totals?.totalTaxLiability),
    totalTds:
      report?.totalTds !== undefined
        ? toNumber(report.totalTds)
        : toNumber(totals?.tdsTillLastMonth) +
          toNumber(totals?.tdsCurrentMonth),
    monthlyRecords: (report?.monthlyRecords ?? monthlyReport).map(
      (record: any) => ({
        month: toText(record?.monthName, toMonthName(record?.month)),
        year: toNumber(record?.year),
        taxableIncome: toNumber(record?.taxableIncome),
        tds: toNumber(record?.tds),
        payrollId: toNumber(record?.payrollId),
      })
    ),
  };
};

export async function getEmployeePayrollHistory(
  employeeId: number
): Promise<PayrollHistoryItem[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/employee/${employeeId}`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data?.data;
      if (!Array.isArray(data)) {
        throw new Error(
          response.data?.message || "Failed to fetch payroll history"
        );
      }
      return data.map(toHistoryItem);
    } else {
      throw new Error(response.data.message || "Failed to fetch payroll history");
    }
  } catch (error: any) {
    console.error("[getEmployeePayrollHistory] Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "An error occurred while fetching payroll history."
    );
  }
}

export async function getPayrollDetail(
  payrollId: number
): Promise<PayrollDetail> {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/${payrollId}`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data?.data;
      if (!data || typeof data !== "object") {
        throw new Error(
          response.data?.message || "Failed to fetch payroll detail"
        );
      }
      return toPayrollDetail(data);
    } else {
      throw new Error(response.data.message || "Failed to fetch payroll detail");
    }
  } catch (error: any) {
    console.error("[getPayrollDetail] Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "An error occurred while fetching payroll detail."
    );
  }
}

export async function getPayslipData(
  payrollId: number
): Promise<PayslipData> {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/payslip/${payrollId}/data`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data?.data;
      if (!data || typeof data !== "object") {
        throw new Error(
          response.data?.message || "Failed to fetch payslip data"
        );
      }
      return toPayslipData(data);
    } else {
      throw new Error(response.data.message || "Failed to fetch payslip data");
    }
  } catch (error: any) {
    console.error("[getPayslipData] Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "An error occurred while fetching payslip data."
    );
  }
}

export async function getPayslipPdf(
  payrollId: number
): Promise<Blob> {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/payslip/${payrollId}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to download payslip PDF");
    }
  } catch (error: any) {
    console.error("[getPayslipPdf] Error:", error);
    throw new Error(
      error.response?.data?.message || "An error occurred while downloading payslip PDF."
    );
  }
}

export async function getEmployeeTaxReport(
  employeeId: number
): Promise<TaxReport> {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/tax/report/employee/${employeeId}`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data?.data;
      if (!data || typeof data !== "object") {
        throw new Error(response.data?.message || "Failed to fetch tax report");
      }
      return toTaxReport(data);
    } else {
      throw new Error(response.data.message || "Failed to fetch tax report");
    }
  } catch (error: any) {
    console.error("[getEmployeeTaxReport] Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "An error occurred while fetching tax report."
    );
  }
}

export async function getEmployeeTaxReportPdf(
  employeeId: number
): Promise<Blob> {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/tax/report/employee/${employeeId}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to download tax report PDF");
    }
  } catch (error: any) {
    console.error("[getEmployeeTaxReportPdf] Error:", error);
    throw new Error(
      error.response?.data?.message || "An error occurred while downloading tax report PDF."
    );
  }
}

export async function getPayrollTaxDetail(
  payrollId: number
): Promise<PayrollTaxDetail> {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${baseUrl}/api/v1/payroll/tax/${payrollId}`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data?.data;
      if (!data || typeof data !== "object") {
        throw new Error(response.data?.message || "Failed to fetch tax detail");
      }
      return toTaxDetail(data);
    } else {
      throw new Error(response.data.message || "Failed to fetch tax detail");
    }
  } catch (error: any) {
    console.error("[getPayrollTaxDetail] Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "An error occurred while fetching tax detail."
    );
  }
}