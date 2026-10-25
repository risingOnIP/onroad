import { useMemo } from "react";
import { SchemaItem, FormResponse } from "../types/realtor";
import { calculateFormProgress, FormProgress } from "../utils/formProgress";

export interface UseFormProgressOptions {
  enabled?: boolean;
  schema: SchemaItem[];
  formResponses: FormResponse;
  isFieldVisible?: (item: SchemaItem) => boolean;
}

export interface UseFormProgressResult {
  progress: FormProgress | null;
  isEnabled: boolean;
  canSubmit: boolean;
  validationErrors: string[];
}

/**
 * Hook to calculate and manage form progress based on required fields
 * @param options - Configuration options
 * @returns Form progress data and utilities
 */
export function useFormProgress({
  enabled = true,
  schema,
  formResponses,
  isFieldVisible
}: UseFormProgressOptions): UseFormProgressResult {
  
  const progress = useMemo(() => {
    if (!enabled || !schema?.length) return null;
    
    const calculated = calculateFormProgress(schema, formResponses, isFieldVisible);
    
    // Return null if there are no required fields
    if (calculated.total === 0) return null;
    
    return calculated;
  }, [enabled, schema, formResponses, isFieldVisible]);
  
  const canSubmit = useMemo(() => {
    if (!progress) return true; // No required fields means form can be submitted
    return progress.isComplete;
  }, [progress]);
  
  const validationErrors = useMemo(() => {
    if (!progress || progress.isComplete) return [];
    
    return progress.missingFields.map(field => {
      const displayName = field.display_attributes.display_name;
      
      // Handle checkbox fields with blank display names
      if (field.display_attributes.input_type === 'checkbox' && (!displayName || displayName.trim() === '')) {
        const blockName = field.display_attributes.block || 'Unknown';
        return `Checkbox field in ${blockName} section is required`;
      }
      
      return `${displayName || 'Field'} is required`;
    });
  }, [progress]);
  
  return {
    progress,
    isEnabled: enabled,
    canSubmit,
    validationErrors
  };
}

/**
 * Hook to calculate form progress for multiple schemas (useful for multi-step forms)
 * @param schemas - Array of schema arrays
 * @param formResponses - Array of form responses corresponding to each schema
 * @param enabled - Whether progress tracking is enabled
 * @param isFieldVisible - Optional function to check if a field is visible
 * @returns Combined progress data
 */
export function useMultiFormProgress(
  schemas: SchemaItem[][],
  formResponses: FormResponse[],
  enabled: boolean = true,
  isFieldVisible?: (item: SchemaItem) => boolean
): UseFormProgressResult {
  
  const combinedProgress = useMemo(() => {
    if (!enabled || !schemas?.length || !formResponses?.length) return null;
    
    let totalRequired = 0;
    let totalCompleted = 0;
    let allRequiredFields: SchemaItem[] = [];
    let allMissingFields: SchemaItem[] = [];
    
    schemas.forEach((schema, index) => {
      const responses = formResponses[index] || {};
      const progress = calculateFormProgress(schema, responses, isFieldVisible);
      
      totalRequired += progress.total;
      totalCompleted += progress.completed;
      allRequiredFields = [...allRequiredFields, ...progress.requiredFields];
      allMissingFields = [...allMissingFields, ...progress.missingFields];
    });
    
    if (totalRequired === 0) return null;
    
    const percentage = Math.round((totalCompleted / totalRequired) * 100);
    
    return {
      completed: totalCompleted,
      total: totalRequired,
      percentage,
      isComplete: totalCompleted === totalRequired,
      requiredFields: allRequiredFields,
      missingFields: allMissingFields
    };
  }, [enabled, schemas, formResponses, isFieldVisible]);
  
  const canSubmit = useMemo(() => {
    if (!combinedProgress) return true;
    return combinedProgress.isComplete;
  }, [combinedProgress]);
  
  const validationErrors = useMemo(() => {
    if (!combinedProgress || combinedProgress.isComplete) return [];
    
    return combinedProgress.missingFields.map(field => {
      const displayName = field.display_attributes.display_name;
      
      // Handle checkbox fields with blank display names
      if (field.display_attributes.input_type === 'checkbox' && (!displayName || displayName.trim() === '')) {
        const blockName = field.display_attributes.block || 'Unknown';
        return `Checkbox field in ${blockName} section is required`;
      }
      
      return `${displayName || 'Field'} is required`;
    });
  }, [combinedProgress]);
  
  return {
    progress: combinedProgress,
    isEnabled: enabled,
    canSubmit,
    validationErrors
  };
}