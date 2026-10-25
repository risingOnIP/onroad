"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  PiggyBank,
  Home,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { FinancialResults, FinancialAssumptions } from "@/components/files/realtor/financial/types";

interface ResultsDisplayProps {
  results: FinancialResults;
  assumptions: FinancialAssumptions;
}

export default function ResultsDisplay({ results, assumptions }: ResultsDisplayProps) {
  const [selectedMetric, setSelectedMetric] = useState<"cashflow" | "returns" | "breakdown">("cashflow");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  };

  // Prepare chart data
  const cashFlowChartData = results.annualCashFlow.map((cf) => ({
    year: `Year ${cf.year}`,
    cashFlow: cf.beforeTaxCashFlow,
    noi: cf.noi,
    equity: cf.equity,
  }));

  const monthlyTrendData = results.monthlyCashFlow.slice(0, 60).map((cf) => ({
    month: `M${cf.month}`,
    cashFlow: cf.netCashFlow,
    cumulative: cf.cumulativeCashFlow,
  }));

  const expenseBreakdownData = [
    { name: "Debt Service", value: results.annualCashFlow[0].debtService },
    { name: "Property Tax", value: assumptions.purchasePrice * assumptions.propertyTaxRate / 100 },
    { name: "Insurance", value: assumptions.insuranceAnnual },
    { name: "HOA", value: assumptions.hoaMonthly * 12 },
    { name: "Maintenance", value: assumptions.purchasePrice * assumptions.maintenancePercent / 100 },
    { name: "Management", value: results.annualCashFlow[0].grossIncome * assumptions.managementPercent / 100 },
  ].filter(item => item.value > 0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  // Determine if metrics are positive or negative
  const getMetricColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getMetricIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              IRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getMetricColor(results.irr)}`}>
                {formatPercent(results.irr)}
              </span>
              {getMetricIcon(results.irr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Internal Rate of Return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash-on-Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getMetricColor(results.cashOnCashReturn)}`}>
                {formatPercent(results.cashOnCashReturn)}
              </span>
              {getMetricIcon(results.cashOnCashReturn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Year 1 Return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getMetricColor(results.totalReturn)}`}>
                {formatPercent(results.totalReturn)}
              </span>
              {getMetricIcon(results.totalReturn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall ROI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getMetricColor(results.totalProfit)}`}>
                {formatCurrency(results.totalProfit)}
              </span>
              {getMetricIcon(results.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net Gain</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cap Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-semibold">{formatPercent(results.capRate)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Break-Even
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-semibold">
              {results.breakEvenYear > 0 ? `Year ${results.breakEvenYear}` : "N/A"}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              DSCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-semibold">
              {results.debtServiceCoverageRatio.toFixed(2)}x
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analysis */}
      <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="returns">Returns Analysis</TabsTrigger>
          <TabsTrigger value="breakdown">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-4">
          {/* Annual Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Annual Cash Flow Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cashFlow"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Cash Flow"
                  />
                  <Area
                    type="monotone"
                    dataKey="noi"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="NOI"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow Trend (First 5 Years)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cashFlow"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                    name="Monthly"
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={false}
                    name="Cumulative"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cash Flow Table */}
          <Card>
            <CardHeader>
              <CardTitle>Annual Cash Flow Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Gross Income</TableHead>
                      <TableHead className="text-right">NOI</TableHead>
                      <TableHead className="text-right">Debt Service</TableHead>
                      <TableHead className="text-right">Cash Flow</TableHead>
                      <TableHead className="text-right">CoC Return</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.annualCashFlow.map((cf) => (
                      <TableRow key={cf.year}>
                        <TableCell>{cf.year}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cf.grossIncome)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cf.noi)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cf.debtService)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getMetricColor(cf.beforeTaxCashFlow)}`}>
                          {formatCurrency(cf.beforeTaxCashFlow)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercent(cf.cashOnCashReturn)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          {/* Equity Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Equity Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                    name="Equity"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Investment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Initial Investment</span>
                  <span className="font-medium">{formatCurrency(results.totalCashInvested)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Cash Flow (Operations)</span>
                  <span className="font-medium">{formatCurrency(results.totalCashFlowBeforeSale)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Net Proceeds from Sale</span>
                  <span className="font-medium">{formatCurrency(results.netProceedsFromSale)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Average Annual Cash Flow</span>
                  <span className="font-medium">{formatCurrency(results.averageAnnualCashFlow)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-semibold">Total Profit</span>
                  <span className={`text-lg font-bold ${getMetricColor(results.totalProfit)}`}>
                    {formatCurrency(results.totalProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Strategy Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Estimated Sale Price</span>
                  <span className="font-medium">
                    {formatCurrency(results.saleAnalysis.estimatedSalePrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Selling Costs</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(results.saleAnalysis.sellingCosts)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Remaining Mortgage</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(results.saleAnalysis.mortgageBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-semibold">Net Proceeds</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(results.saleAnalysis.netProceeds)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          {/* Expense Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Annual Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Purchase Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Initial Investment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Down Payment</span>
                  <span className="font-medium">
                    {formatCurrency(results.purchaseCosts.downPayment)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Closing Costs</span>
                  <span className="font-medium">
                    {formatCurrency(results.purchaseCosts.closingCosts)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-semibold">Total Initial Investment</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(results.purchaseCosts.totalInitialInvestment)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Operating Expenses (Year 1)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenseBreakdownData.map((expense) => (
                  <div key={expense.name} className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{expense.name}</span>
                    <span className="font-medium">{formatCurrency(expense.value / 12)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-semibold">Total Monthly Expenses</span>
                  <span className="font-bold">
                    {formatCurrency(
                      expenseBreakdownData.reduce((sum, e) => sum + e.value, 0) / 12
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}