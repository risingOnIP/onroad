"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FinancialAssumptions } from "@/components/files/realtor/financial/types";

interface AssumptionsIntakeProps {
  assumptions: FinancialAssumptions;
  dealSide: "buy" | "sell" | "lease" | "rent";
  onChange: (assumptions: FinancialAssumptions) => void;
  calculating: boolean;
}

export default function AssumptionsIntake({
  assumptions,
  dealSide,
  onChange,
  calculating,
}: AssumptionsIntakeProps) {
  const handleChange = (field: keyof FinancialAssumptions, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedAssumptions = { ...assumptions, [field]: numValue };
    
    // Auto-calculate loan amount when purchase price or down payment changes
    if (field === "purchasePrice" || field === "downPaymentPercent") {
      updatedAssumptions.loanAmount = 
        updatedAssumptions.purchasePrice * 
        (1 - updatedAssumptions.downPaymentPercent / 100);
    }
    
    onChange(updatedAssumptions);
  };

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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total purchase price of the property</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="purchasePrice"
                type="number"
                value={assumptions.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", e.target.value)}
                placeholder="500000"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.purchasePrice)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="downPaymentPercent">Down Payment %</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage of purchase price paid upfront</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="downPaymentPercent"
                type="number"
                step="0.5"
                value={assumptions.downPaymentPercent}
                onChange={(e) => handleChange("downPaymentPercent", e.target.value)}
                placeholder="20"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.purchasePrice * assumptions.downPaymentPercent / 100)} down
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingCosts">Closing Costs</Label>
              <Input
                id="closingCosts"
                type="number"
                value={assumptions.closingCosts}
                onChange={(e) => handleChange("closingCosts", e.target.value)}
                placeholder="5000"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.closingCosts)}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount</Label>
              <Input
                id="loanAmount"
                type="number"
                value={assumptions.loanAmount}
                disabled
                className="bg-muted"
              />
              <span className="text-xs text-muted-foreground">
                Auto-calculated
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Financing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financing</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="interestRate">Interest Rate %</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Annual interest rate on the loan</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={assumptions.interestRate}
                onChange={(e) => handleChange("interestRate", e.target.value)}
                placeholder="7.0"
              />
              <span className="text-xs text-muted-foreground">
                {formatPercent(assumptions.interestRate)} APR
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanTermYears">Loan Term (Years)</Label>
              <Input
                id="loanTermYears"
                type="number"
                value={assumptions.loanTermYears}
                onChange={(e) => handleChange("loanTermYears", e.target.value)}
                placeholder="30"
              />
              <span className="text-xs text-muted-foreground">
                {assumptions.loanTermYears * 12} months
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Income */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="monthlyRent">Monthly Rent</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected monthly rental income</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="monthlyRent"
                type="number"
                value={assumptions.monthlyRent}
                onChange={(e) => handleChange("monthlyRent", e.target.value)}
                placeholder="3000"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.monthlyRent * 12)}/year
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentGrowthRate">Rent Growth Rate %</Label>
              <Input
                id="rentGrowthRate"
                type="number"
                step="0.5"
                value={assumptions.rentGrowthRate}
                onChange={(e) => handleChange("rentGrowthRate", e.target.value)}
                placeholder="3"
              />
              <span className="text-xs text-muted-foreground">
                Annual increase
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacancyRate">Vacancy Rate %</Label>
              <Input
                id="vacancyRate"
                type="number"
                step="1"
                value={assumptions.vacancyRate}
                onChange={(e) => handleChange("vacancyRate", e.target.value)}
                placeholder="5"
              />
              <span className="text-xs text-muted-foreground">
                {formatPercent(assumptions.vacancyRate)} of year vacant
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherIncome">Other Income (Monthly)</Label>
              <Input
                id="otherIncome"
                type="number"
                value={assumptions.otherIncome}
                onChange={(e) => handleChange("otherIncome", e.target.value)}
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">
                Parking, storage, etc.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operating Expenses</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="propertyTaxRate">Property Tax Rate %</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Annual property tax as % of property value</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="propertyTaxRate"
                type="number"
                step="0.1"
                value={assumptions.propertyTaxRate}
                onChange={(e) => handleChange("propertyTaxRate", e.target.value)}
                placeholder="1.2"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.purchasePrice * assumptions.propertyTaxRate / 100)}/year
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceAnnual">Insurance (Annual)</Label>
              <Input
                id="insuranceAnnual"
                type="number"
                value={assumptions.insuranceAnnual}
                onChange={(e) => handleChange("insuranceAnnual", e.target.value)}
                placeholder="1200"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.insuranceAnnual / 12)}/month
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoaMonthly">HOA Fees (Monthly)</Label>
              <Input
                id="hoaMonthly"
                type="number"
                value={assumptions.hoaMonthly}
                onChange={(e) => handleChange("hoaMonthly", e.target.value)}
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(assumptions.hoaMonthly * 12)}/year
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenancePercent">Maintenance %</Label>
              <Input
                id="maintenancePercent"
                type="number"
                step="0.5"
                value={assumptions.maintenancePercent}
                onChange={(e) => handleChange("maintenancePercent", e.target.value)}
                placeholder="1"
              />
              <span className="text-xs text-muted-foreground">
                % of property value/year
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managementPercent">Management Fee %</Label>
              <Input
                id="managementPercent"
                type="number"
                step="1"
                value={assumptions.managementPercent}
                onChange={(e) => handleChange("managementPercent", e.target.value)}
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">
                % of rental income
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Growth & Exit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth & Exit Strategy</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="appreciationRate">Appreciation Rate %</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected annual property value increase</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="appreciationRate"
                type="number"
                step="0.5"
                value={assumptions.appreciationRate}
                onChange={(e) => handleChange("appreciationRate", e.target.value)}
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inflationRate">Inflation Rate %</Label>
              <Input
                id="inflationRate"
                type="number"
                step="0.5"
                value={assumptions.inflationRate}
                onChange={(e) => handleChange("inflationRate", e.target.value)}
                placeholder="2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holdingPeriodYears">Holding Period (Years)</Label>
              <Input
                id="holdingPeriodYears"
                type="number"
                value={assumptions.holdingPeriodYears}
                onChange={(e) => handleChange("holdingPeriodYears", e.target.value)}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitCapRate">Exit Cap Rate %</Label>
              <Input
                id="exitCapRate"
                type="number"
                step="0.25"
                value={assumptions.exitCapRate}
                onChange={(e) => handleChange("exitCapRate", e.target.value)}
                placeholder="6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingCostsPercent">Selling Costs %</Label>
              <Input
                id="sellingCostsPercent"
                type="number"
                step="0.5"
                value={assumptions.sellingCostsPercent}
                onChange={(e) => handleChange("sellingCostsPercent", e.target.value)}
                placeholder="7"
              />
              <span className="text-xs text-muted-foreground">
                Commission + closing costs
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Status */}
        {calculating && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
            <span className="text-sm">Calculating results...</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}