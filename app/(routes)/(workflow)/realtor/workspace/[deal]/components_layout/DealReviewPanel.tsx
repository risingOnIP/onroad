"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileCheck,
  Send,
  X,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle,
  GripVertical,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { sendFormForReview, sendMultipleFormsForReview } from "@/app/actions/realtor/form-review-actions";
import { formTypeDisplay } from "../components/PreviewSection";

// Types
interface FormForReview {
  id: string;
  form_name: string;
  form_type: string;
  form_response?: any;
  review_stage?: 'not_sent' | 'reviewing' | 'approved';
  dealOptionId: string;
  dealOptionAddress: string;
  completionPercentage?: number;
}

interface DealOptionWithForms {
  id: string;
  address: string;
  forms: FormForReview[];
  isExpanded: boolean;
}

interface DealReviewPanelProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DealReviewPanel({
  dealId,
  isOpen,
  onClose,
}: DealReviewPanelProps) {
  const [dealOptions, setDealOptions] = useState<DealOptionWithForms[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedForms, setSelectedForms] = useState<FormForReview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load all forms when modal opens
  useEffect(() => {
    if (isOpen) {
      loadForms();
    } else {
      // Reset selections when closing
      setSelectedForms([]);
      setErrorMessage(null);
      setDraggedIndex(null);
    }
  }, [dealId, isOpen]);

  const loadForms = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Get all deal options with their forms
      const dealOptionsData = await getDealOptionsWithForms(dealId);

      const organizedDealOptions: DealOptionWithForms[] = [];

      // Process each deal option's forms
      for (const dealOption of dealOptionsData) {
        const forms: FormForReview[] = [];
        
        if (dealOption.forms && dealOption.forms.length > 0) {
          for (const form of dealOption.forms) {
            // Calculate completion percentage if form_response exists
            let completionPercentage = 0;
            if (form.form_response) {
              const totalFields = Object.keys(form.form_response).length;
              const filledFields = Object.values(form.form_response).filter(
                (value) => value !== null && value !== undefined && value !== ""
              ).length;
              completionPercentage = totalFields > 0 
                ? Math.round((filledFields / totalFields) * 100)
                : 0;
            }

            forms.push({
              id: form.id,
              form_name: formTypeDisplay(form.form_type),
              form_type: form.form_type,
              form_response: form.form_response,
              review_stage: form.review_stage || 'not_sent',
              dealOptionId: dealOption.id,
              dealOptionAddress: dealOption.address,
              completionPercentage,
            });
          }
        }

        if (forms.length > 0) {
          organizedDealOptions.push({
            id: dealOption.id,
            address: dealOption.address,
            forms,
            isExpanded: true,
          });
        }
      }

      setDealOptions(organizedDealOptions);
    } catch (error) {
      console.error("Error loading forms:", error);
      setErrorMessage("Failed to load forms. Please try again.");
      toast.error("Failed to load forms");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDealOptionExpansion = (dealOptionId: string) => {
    setDealOptions((prev) =>
      prev.map((dealOption) =>
        dealOption.id === dealOptionId
          ? { ...dealOption, isExpanded: !dealOption.isExpanded }
          : dealOption
      )
    );
  };

  const toggleFormSelection = (form: FormForReview) => {
    const isSelected = selectedForms.some((f) => f.id === form.id);
    if (isSelected) {
      setSelectedForms(selectedForms.filter((f) => f.id !== form.id));
    } else {
      setSelectedForms([...selectedForms, form]);
    }
  };

  const toggleAllFormsInDealOption = (dealOptionId: string) => {
    const dealOption = dealOptions.find((d) => d.id === dealOptionId);
    if (!dealOption) return;

    const eligibleForms = dealOption.forms.filter(
      (f) => f.review_stage !== 'reviewing' && f.review_stage !== 'approved'
    );
    
    const selectedIds = new Set(selectedForms.map(f => f.id));
    const allSelected = eligibleForms.every((f) => selectedIds.has(f.id));
    
    if (allSelected) {
      // Remove all from this deal option
      setSelectedForms(selectedForms.filter(f => !eligibleForms.some(ef => ef.id === f.id)));
    } else {
      // Add all from this deal option that aren't already selected
      const newForms = eligibleForms.filter(f => !selectedIds.has(f.id));
      setSelectedForms([...selectedForms, ...newForms]);
    }
  };

  const selectAllEligibleForms = () => {
    const eligibleForms = dealOptions
      .flatMap((d) => d.forms)
      .filter((f) => f.review_stage !== 'reviewing' && f.review_stage !== 'approved');
    
    setSelectedForms(eligibleForms);
  };

  const clearSelection = () => {
    setSelectedForms([]);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSelectedForms = [...selectedForms];
    const [draggedForm] = newSelectedForms.splice(draggedIndex, 1);
    newSelectedForms.splice(dropIndex, 0, draggedForm);
    
    setSelectedForms(newSelectedForms);
    setDraggedIndex(null);
  };

  const handleSendForReview = async () => {
    if (selectedForms.length === 0) {
      toast.error("Please select at least one form to send for review");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      // Send forms in the selected order
      const formIds = selectedForms.map(f => f.id);
      
      // Send multiple forms for review
      if (formIds.length === 1) {
        await sendFormForReview(formIds[0]);
        toast.success("Form sent for broker review!");
      } else {
        await sendMultipleFormsForReview(formIds);
        toast.success(`${formIds.length} forms sent for broker review in the specified order!`);
      }

      // Reload forms to get updated review stages
      await loadForms();
      
      // Clear selections
      setSelectedForms([]);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error sending forms for review:", error);
      setErrorMessage("Failed to send forms for review. Please try again.");
      toast.error("Failed to send forms for review");
    } finally {
      setIsSending(false);
    }
  };

  const getReviewStageBadge = (stage: string | undefined) => {
    switch (stage) {
      case 'reviewing':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      default:
        return null;
    }
  };

  const eligibleFormsCount = dealOptions
    .flatMap((d) => d.forms)
    .filter((f) => f.review_stage !== 'reviewing' && f.review_stage !== 'approved')
    .length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1200px] !w-[85vw] !h-[85vh] !max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <div className="p-6 pb-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Send Forms for Broker Review
            </DialogTitle>
            <DialogDescription>
              Select forms to send for broker review. Your broker will be notified and the forms will be locked during review.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mt-4">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="flex items-center justify-between px-1 py-3 mt-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedForms.length} of {eligibleFormsCount} forms selected
              </span>
              {eligibleFormsCount > 0 && (
                <>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={selectAllEligibleForms}
                    className="h-auto p-0 text-blue-600"
                  >
                    Select All
                  </Button>
                  {selectedForms.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={clearSelection}
                      className="h-auto p-0 text-gray-600"
                    >
                      Clear
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex-1 flex min-h-0 gap-0">
          {/* Left Panel - Available Forms */}
          <div className="flex-1 border-r">
            <div className="px-6 py-3 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">Available Forms</h3>
            </div>
            <ScrollArea className="h-full px-6 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600">Loading forms...</p>
              </div>
            </div>
          ) : dealOptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FolderOpen className="h-12 w-12 mb-3" />
              <p className="text-sm">No forms available</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {dealOptions.map((dealOption) => {
                const eligibleForms = dealOption.forms.filter(
                  (f) => f.review_stage !== 'reviewing' && f.review_stage !== 'approved'
                );
                const selectedIds = new Set(selectedForms.map(f => f.id));
                const allSelected = eligibleForms.length > 0 && 
                  eligibleForms.every((f) => selectedIds.has(f.id));
                
                return (
                  <div
                    key={dealOption.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleDealOptionExpansion(dealOption.id)}
                    >
                      <div className="flex items-center gap-3">
                        {dealOption.isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium">{dealOption.address}</span>
                        <Badge variant="secondary">
                          {dealOption.forms.length} forms
                        </Badge>
                        {eligibleForms.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAllFormsInDealOption(dealOption.id);
                            }}
                            className="flex items-center"
                          >
                            <Checkbox
                              checked={allSelected}
                              className="ml-2"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              Select all eligible
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {dealOption.isExpanded && (
                      <div className="p-3 space-y-2">
                        {dealOption.forms.map((form) => {
                          const isDisabled = form.review_stage === 'reviewing' || 
                                            form.review_stage === 'approved';
                          
                          const isSelected = selectedIds.has(form.id);
                          
                          return (
                            <div
                              key={form.id}
                              className={`flex items-center justify-between p-3 border rounded-lg ${
                                isDisabled 
                                  ? 'bg-gray-50 opacity-60' 
                                  : isSelected
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'hover:bg-gray-50 cursor-pointer'
                              } transition-colors`}
                              onClick={() => !isDisabled && toggleFormSelection(form)}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={() => !isDisabled && toggleFormSelection(form)}
                                />
                                <div>
                                  <p className="font-medium">{form.form_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      Type: {form.form_type}
                                    </span>
                                    {form.completionPercentage !== undefined && (
                                      <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                          {form.completionPercentage}% complete
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {getReviewStageBadge(form.review_stage)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
            </ScrollArea>
          </div>

          {/* Right Panel - Selected Forms (Reorderable) */}
          <div className="w-2/5 min-w-[400px]">
            <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Selected Forms (Drag to Reorder)</h3>
              {selectedForms.length > 0 && (
                <Badge variant="secondary">{selectedForms.length} selected</Badge>
              )}
            </div>
            <ScrollArea className="h-full px-6 pb-2">
              {selectedForms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ArrowRight className="h-8 w-8 mb-2" />
                  <p className="text-sm">Select forms to send for review</p>
                  <p className="text-xs mt-1">You can reorder them after selection</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  {selectedForms.map((form, index) => (
                    <div
                      key={form.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move transition-all ${
                        draggedIndex === index 
                          ? 'opacity-50 scale-95' 
                          : 'hover:shadow-md hover:border-blue-300'
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <p className="font-medium text-sm truncate">{form.form_name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {form.dealOptionAddress} • {form.completionPercentage}% complete
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFormSelection(form)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="p-6 pt-4 flex-shrink-0 border-t">
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendForReview}
              disabled={isSending || selectedForms.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {selectedForms.length > 0 ? `${selectedForms.length} Form${selectedForms.length > 1 ? 's' : ''}` : ''} for Review
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}