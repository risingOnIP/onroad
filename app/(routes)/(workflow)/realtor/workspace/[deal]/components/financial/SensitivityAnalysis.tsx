"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Plus, 
  Trash2, 
  Settings,
  TrendingUp,
  AlertCircle,
  Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import {
  FinancialAssumptions,
  SensitivityConfig,
  SensitivityResults,
  SensitivityVariable,
} from "@/components/files/realtor/financial/types";

interface SensitivityAnalysisProps {
  config: SensitivityConfig;
  onConfigChange: (config: SensitivityConfig) => void;
  assumptions: FinancialAssumptions;
  results: SensitivityResults | null;
  onAnalyze: (config: SensitivityConfig) => Promise<void>;
}

export default function SensitivityAnalysis({
  config,
  onConfigChange,
  assumptions,
  results,
  onAnalyze,
}: SensitivityAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<string>("");
  const [variableRange, setVariableRange] = useState({ min: -20, max: 20, step: 5 });

  const availableVariables = [
    { value: "interestRate", label: "Interest Rate", unit: "%", isAbsolute: true },
    { value: "purchasePrice", label: "Purchase Price", unit: "%", isAbsolute: false },
    { value: "monthlyRent", label: "Monthly Rent", unit: "%", isAbsolute: false },
    { value: "vacancyRate", label: "Vacancy Rate", unit: "%", isAbsolute: true },
    { value: "appreciationRate", label: "Appreciation Rate", unit: "%", isAbsolute: true },
    { value: "maintenancePercent", label: "Maintenance Cost", unit: "%", isAbsolute: true },
    { value: "exitCapRate", label: "Exit Cap Rate", unit: "%", isAbsolute: true },
    { value: "downPaymentPercent", label: "Down Payment", unit: "%", isAbsolute: true },
  ];

  const targetMetrics = [
    { value: "irr", label: "IRR" },
    { value: "cashOnCashReturn", label: "Cash-on-Cash Return" },
    { value: "totalReturn", label: "Total Return" },
    { value: "noi", label: "NOI" },
    { value: "npv", label: "NPV" },
    { value: "capRate", label: "Cap Rate" },
  ];

  const handleAddVariable = () => {
    if (!selectedVariable) return;

    const variable = availableVariables.find(v => v.value === selectedVariable);
    if (!variable) return;

    const newVariable: SensitivityVariable = {
      name: selectedVariable,
      label: variable.label,
      min: variable.isAbsolute ? variableRange.min : variableRange.min,
      max: variable.isAbsolute ? variableRange.max : variableRange.max,
      step: variableRange.step,
      isPercentage: !variable.isAbsolute,
    };

    onConfigChange({
      ...config,
      variables: [...config.variables, newVariable],
    });

    setSelectedVariable("");
    setVariableRange({ min: -20, max: 20, step: 5 });
  };

  const handleRemoveVariable = (index: number) => {
    onConfigChange({
      ...config,
      variables: config.variables.filter((_, i) => i !== index),
    });
  };

  const handleUpdateVariable = (index: number, updates: Partial<SensitivityVariable>) => {
    const updatedVariables = [...config.variables];
    updatedVariables[index] = { ...updatedVariables[index], ...updates };
    onConfigChange({
      ...config,
      variables: updatedVariables,
    });
  };

  const handleMetricToggle = (metric: string) => {
    const isSelected = config.targetMetrics.includes(metric);
    onConfigChange({
      ...config,
      targetMetrics: isSelected
        ? config.targetMetrics.filter(m => m !== metric)
        : [...config.targetMetrics, metric],
    });
  };

  const handleRunAnalysis = async () => {
    if (config.variables.length === 0) {
      alert("Please add at least one variable to analyze");
      return;
    }
    if (config.targetMetrics.length === 0) {
      alert("Please select at least one target metric");
      return;
    }

    setAnalyzing(true);
    try {
      await onAnalyze(config);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatValue = (value: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${value > 0 ? "+" : ""}${value}%`;
    }
    return `${value.toFixed(2)}%`;
  };

  const formatMetricValue = (value: number, metric: string) => {
    if (["irr", "cashOnCashReturn", "totalReturn", "capRate"].includes(metric)) {
      return `${value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare heat map data for visualization
  const prepareHeatMapData = () => {
    if (!results || !results.heatMapData || results.heatMapData.length === 0) return [];

    return results.heatMapData.map(point => ({
      x: point.variable1Value,
      y: point.variable2Value,
      value: point.metricValue,
    }));
  };

  const getColorForValue = (value: number, min: number, max: number) => {
    const normalized = (value - min) / (max - min);
    const hue = normalized * 120; // 0 (red) to 120 (green)
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sensitivity Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Variable */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="text-sm font-semibold">Add Variable to Test</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Variable</Label>
                  <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVariables
                        .filter(v => !config.variables.find(cv => cv.name === v.value))
                        .map(variable => (
                          <SelectItem key={variable.value} value={variable.value}>
                            {variable.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Min ({selectedVariable && availableVariables.find(v => v.value === selectedVariable)?.isAbsolute ? "%" : "% change"})</Label>
                  <Input
                    type="number"
                    value={variableRange.min}
                    onChange={(e) => setVariableRange({ ...variableRange, min: parseFloat(e.target.value) || 0 })}
                    placeholder="-20"
                  />
                </div>

                <div>
                  <Label>Max ({selectedVariable && availableVariables.find(v => v.value === selectedVariable)?.isAbsolute ? "%" : "% change"})</Label>
                  <Input
                    type="number"
                    value={variableRange.max}
                    onChange={(e) => setVariableRange({ ...variableRange, max: parseFloat(e.target.value) || 0 })}
                    placeholder="20"
                  />
                </div>

                <div>
                  <Label>Step</Label>
                  <Input
                    type="number"
                    value={variableRange.step}
                    onChange={(e) => setVariableRange({ ...variableRange, step: parseFloat(e.target.value) || 1 })}
                    placeholder="5"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddVariable}
                disabled={!selectedVariable}
                size="sm"
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>

            {/* Active Variables */}
            {config.variables.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Active Variables</h4>
                {config.variables.map((variable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{variable.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Range: {formatValue(variable.min, variable.isPercentage || false)} 
                        {" to "}
                        {formatValue(variable.max, variable.isPercentage || false)}
                        {" (step: "}{variable.step})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariable(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Target Metrics */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Target Metrics</h4>
              <div className="flex flex-wrap gap-2">
                {targetMetrics.map(metric => (
                  <div key={metric.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.value}
                      checked={config.targetMetrics.includes(metric.value)}
                      onCheckedChange={() => handleMetricToggle(metric.value)}
                    />
                    <Label
                      htmlFor={metric.value}
                      className="text-sm cursor-pointer"
                    >
                      {metric.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Run Analysis Button */}
            <Button
              onClick={handleRunAnalysis}
              disabled={analyzing || config.variables.length === 0 || config.targetMetrics.length === 0}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Sensitivity Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <>
            {/* Scenario Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sensitivity Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.scenarios && results.scenarios.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variable</TableHead>
                          <TableHead>Value</TableHead>
                          {config.targetMetrics.map(metric => (
                            <TableHead key={metric} className="text-right">
                              {targetMetrics.find(m => m.value === metric)?.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.scenarios.map((scenario, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {config.variables.find(v => v.name === scenario.variableName)?.label}
                            </TableCell>
                            <TableCell>
                              {formatValue(
                                scenario.variableValue,
                                config.variables.find(v => v.name === scenario.variableName)?.isPercentage || false
                              )}
                            </TableCell>
                            {config.targetMetrics.map(metric => {
                              const value = scenario.results[metric as keyof typeof scenario.results];
                              const baseValue = results.baseCase[metric as keyof typeof results.baseCase];
                              const percentChange = ((Number(value) - Number(baseValue)) / Number(baseValue)) * 100;
                              
                              return (
                                <TableCell key={metric} className="text-right">
                                  <div>
                                    {value !== undefined ? formatMetricValue(Number(value), metric) : "N/A"}
                                    {percentChange !== 0 && (
                                      <span className={`text-xs ml-1 ${percentChange > 0 ? "text-green-600" : "text-red-600"}`}>
                                        ({percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%)
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No sensitivity results available. Run an analysis to see results.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Heat Map Visualization (if 2 variables) */}
            {config.variables.length === 2 && results.heatMapData && results.heatMapData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity Heat Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="x"
                        name={config.variables[0].label}
                        label={{ value: config.variables[0].label, position: "insideBottom", offset: -5 }}
                      />
                      <YAxis
                        dataKey="y"
                        name={config.variables[1].label}
                        label={{ value: config.variables[1].label, angle: -90, position: "insideLeft" }}
                      />
                      <RechartsTooltip
                        formatter={(value) => formatMetricValue(Number(value), config.targetMetrics[0])}
                      />
                      <Scatter
                        data={prepareHeatMapData()}
                        fill="#8884d8"
                      >
                        {prepareHeatMapData().map((entry, index) => {
                          const values = prepareHeatMapData().map(d => d.value);
                          const min = Math.min(...values);
                          const max = Math.max(...values);
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={getColorForValue(entry.value, min, max)}
                            />
                          );
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}