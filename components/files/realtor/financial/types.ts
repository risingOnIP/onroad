export interface FinancialAssumptions {
  // Purchase Details
  purchasePrice: number;
  downPaymentPercent: number;
  closingCosts: number;
  
  // Financing
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  
  // Income
  monthlyRent: number;
  rentGrowthRate: number;
  otherIncome: number;
  vacancyRate: number;
  
  // Expenses
  propertyTaxRate: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePercent: number;
  managementPercent: number;
  
  // Growth & Exit
  appreciationRate: number;
  inflationRate: number;
  holdingPeriodYears: number;
  exitCapRate: number;
  sellingCostsPercent: number;
  
  // Lease-specific (optional)
  leaseTerm?: number;
  securityDeposit?: number;
}

export interface FinancialResults {
  // Key Metrics
  irr: number;
  cashOnCashReturn: number;
  totalReturn: number;
  roi: number;
  noi: number;
  npv: number;
  capRate: number;
  grossRentMultiplier: number;
  debtServiceCoverageRatio: number;
  breakEvenYear: number;
  
  // Cash Flow Projections
  monthlyCashFlow: MonthlyCashFlow[];
  annualCashFlow: AnnualCashFlow[];
  
  // Summary Statistics
  totalCashInvested: number;
  totalCashFlowBeforeSale: number;
  netProceedsFromSale: number;
  totalProfit: number;
  averageAnnualCashFlow: number;
  
  // Detailed Breakdown
  purchaseCosts: {
    downPayment: number;
    closingCosts: number;
    totalInitialInvestment: number;
  };
  
  saleAnalysis: {
    estimatedSalePrice: number;
    sellingCosts: number;
    mortgageBalance: number;
    netProceeds: number;
  };
}

export interface MonthlyCashFlow {
  month: number;
  year: number;
  grossIncome: number;
  vacancy: number;
  effectiveIncome: number;
  operatingExpenses: number;
  debtService: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface AnnualCashFlow {
  year: number;
  grossIncome: number;
  vacancy: number;
  effectiveIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  beforeTaxCashFlow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  cashOnCashReturn: number;
}

export interface SensitivityConfig {
  variables: SensitivityVariable[];
  targetMetrics: string[];
}

export interface SensitivityVariable {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  isPercentage?: boolean; // If true, values are % changes from base
}

export interface SensitivityResults {
  baseCase: FinancialResults;
  scenarios: SensitivityScenario[];
  heatMapData?: HeatMapData[];
}

export interface SensitivityScenario {
  variableName: string;
  variableValue: number;
  results: Partial<FinancialResults>;
  percentChangeFromBase: {
    irr: number;
    cashOnCashReturn: number;
    totalReturn: number;
    noi: number;
  };
}

export interface HeatMapData {
  variable1Name: string;
  variable1Value: number;
  variable2Name: string;
  variable2Value: number;
  metricValue: number;
}

export interface ExcelExportOptions {
  includeAssumptions: boolean;
  includeMonthlyCashFlow: boolean;
  includeAnnualCashFlow: boolean;
  includeSensitivity: boolean;
  includeCharts: boolean;
}