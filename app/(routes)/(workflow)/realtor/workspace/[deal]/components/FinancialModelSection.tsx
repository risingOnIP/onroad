"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileSpreadsheet, TrendingUp, Download, Save, Loader2 } from "lucide-react";
import AssumptionsIntake from "./financial/AssumptionsIntake";
import ResultsDisplay from "./financial/ResultsDisplay";
import SensitivityAnalysis from "./financial/SensitivityAnalysis";
import { 
  getFinancialModel, 
  saveFinancialModel, 
  exportFinancialModelToExcel 
} from "@/app/actions/realtor/financial-actions";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { DealOption } from "@/components/files/types/realtor";
import { toast } from "sonner";
import { 
  FinancialAssumptions, 
  FinancialResults, 
  SensitivityConfig,
  SensitivityResults 
} from "@/components/files/realtor/financial/types";

interface FinancialModelSectionProps {
  dealId: string;
  dealSide: "buy" | "sell" | "lease" | "rent";
}

export default function FinancialModelSection({ dealId, dealSide }: FinancialModelSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("assumptions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [dealOptions, setDealOptions] = useState<DealOption[]>([]);
  const [selectedDealOption, setSelectedDealOption] = useState<string>("");
  
  // Financial model state
  const [assumptions, setAssumptions] = useState<FinancialAssumptions | null>(null);
  const [results, setResults] = useState<FinancialResults | null>(null);
  const [sensitivityConfig, setSensitivityConfig] = useState<SensitivityConfig | null>(null);
  const [sensitivityResults, setSensitivityResults] = useState<SensitivityResults | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load deal options on mount
  useEffect(() => {
    loadDealOptions();
  }, [dealId]);

  // Load financial model when deal option is selected
  useEffect(() => {
    if (selectedDealOption) {
      loadFinancialModel();
    }
  }, [selectedDealOption]);

  const loadDealOptions = async () => {
    try {
      const options = await getDealOptionsWithForms(dealId);
      setDealOptions(options);
      
      // Auto-select first option or the selected one
      const selectedOption = options.find(opt => opt.is_selected);
      if (selectedOption) {
        setSelectedDealOption(selectedOption.id);
      } else if (options.length > 0) {
        setSelectedDealOption(options[0].id);
      }
    } catch (error) {
      console.error("Error loading deal options:", error);
      toast.error("Failed to load properties");
    }
  };

  const loadFinancialModel = async () => {
    setLoading(true);
    try {
      const model = await getFinancialModel(selectedDealOption);
      if (model) {
        setAssumptions(model.assumptions || getDefaultAssumptions());
        setResults(model.results || null);
        setSensitivityConfig(model.sensitivityConfig || getDefaultSensitivityConfig());
        setSensitivityResults(model.sensitivityResults || null);
      } else {
        // Initialize with defaults
        setAssumptions(getDefaultAssumptions());
        setSensitivityConfig(getDefaultSensitivityConfig());
      }
    } catch (error) {
      console.error("Error loading financial model:", error);
      toast.error("Failed to load financial model");
      // Initialize with defaults on error
      setAssumptions(getDefaultAssumptions());
      setSensitivityConfig(getDefaultSensitivityConfig());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAssumptions = (): FinancialAssumptions => {
    // Return default assumptions based on deal side
    const baseDefaults = {
      purchasePrice: 500000,
      downPaymentPercent: 20,
      closingCosts: 5000,
      loanAmount: 400000,
      interestRate: 7.0,
      loanTermYears: 30,
      propertyTaxRate: 1.2,
      insuranceAnnual: 1200,
      hoaMonthly: 0,
      maintenancePercent: 1,
      managementPercent: 0,
      vacancyRate: 5,
      appreciationRate: 3,
      inflationRate: 2.5,
      holdingPeriodYears: 5,
      exitCapRate: 6,
      sellingCostsPercent: 7,
    };

    if (dealSide === "buy" || dealSide === "sell") {
      return {
        ...baseDefaults,
        monthlyRent: 3000,
        rentGrowthRate: 3,
        otherIncome: 0,
      };
    } else {
      // Lease/Rent specific defaults
      return {
        ...baseDefaults,
        monthlyRent: 2500,
        rentGrowthRate: 3,
        otherIncome: 0,
        leaseTerm: 12,
        securityDeposit: 2500,
      };
    }
  };

  const getDefaultSensitivityConfig = (): SensitivityConfig => {
    return {
      variables: [
        {
          name: "interestRate",
          label: "Interest Rate",
          min: 5,
          max: 9,
          step: 0.5,
        },
        {
          name: "purchasePrice",
          label: "Purchase Price",
          min: -10,
          max: 10,
          step: 2,
          isPercentage: true,
        },
        {
          name: "monthlyRent",
          label: "Monthly Rent",
          min: -20,
          max: 20,
          step: 5,
          isPercentage: true,
        },
      ],
      targetMetrics: ["irr", "cashOnCash", "totalReturn", "noi"],
    };
  };

  const handleAssumptionsChange = (newAssumptions: FinancialAssumptions) => {
    setAssumptions(newAssumptions);
    setIsDirty(true);
    // Trigger recalculation
    calculateResults(newAssumptions);
  };

  const calculateResults = async (assumptions: FinancialAssumptions) => {
    setCalculating(true);
    try {
      // This will be calculated on the backend
      const response = await saveFinancialModel(selectedDealOption, {
        assumptions,
        sensitivityConfig: sensitivityConfig || undefined,
      });
      setResults(response.results);
      setIsDirty(false);
    } catch (error) {
      console.error("Error calculating results:", error);
      toast.error("Failed to calculate results");
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!assumptions || !selectedDealOption) return;
    
    setSaving(true);
    try {
      await saveFinancialModel(selectedDealOption, {
        assumptions,
        results: results || undefined,
        sensitivityConfig: sensitivityConfig || undefined,
        sensitivityResults: sensitivityResults || undefined,
      });
      setIsDirty(false);
      toast.success("Financial model saved successfully");
    } catch (error) {
      console.error("Error saving financial model:", error);
      toast.error("Failed to save financial model");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!selectedDealOption) return;
    
    try {
      const blob = await exportFinancialModelToExcel(selectedDealOption);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-model-${selectedDealOption}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (dealOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
        <p className="text-gray-500 text-center max-w-md">
          Add a property to this deal to start creating financial models.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Model</h1>
              <p className="text-sm text-gray-500">
                Analyze investment returns and cash flows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-orange-600 mr-2">Unsaved changes</span>
            )}
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!results}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Model
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Property Selector */}
        {dealOptions.length > 1 && (
          <div className="mt-4">
            <select
              value={selectedDealOption}
              onChange={(e) => setSelectedDealOption(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {dealOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.address}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="assumptions" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Assumptions
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="sensitivity" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Sensitivity
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-6">
            <TabsContent value="assumptions" className="mt-4">
              {assumptions && (
                <AssumptionsIntake
                  assumptions={assumptions}
                  dealSide={dealSide}
                  onChange={handleAssumptionsChange}
                  calculating={calculating}
                />
              )}
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              {results ? (
                <ResultsDisplay
                  results={results}
                  assumptions={assumptions!}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Complete the assumptions to see calculated results
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sensitivity" className="mt-4">
              {sensitivityConfig && assumptions && (
                <SensitivityAnalysis
                  config={sensitivityConfig}
                  onConfigChange={setSensitivityConfig}
                  assumptions={assumptions}
                  results={sensitivityResults}
                  onAnalyze={async (config) => {
                    setSensitivityConfig(config);
                    setIsDirty(true);
                    // Run sensitivity analysis
                    // This will be implemented with the backend
                  }}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}