import { SchemaItem, FormResponse } from "../types/realtor";

export interface FormProgress {
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
  requiredFields: SchemaItem[];
  missingFields: SchemaItem[];
}

/**
 * Calculate form progress based on required fields and form responses
 * @param schema - Array of schema items
 * @param formResponses - Current form responses
 * @param isFieldVisible - Optional function to check if a field is visible (defaults to always true)
 * @returns FormProgress object with completion details
 */
export function calculateFormProgress(
  schema: SchemaItem[],
  formResponses: FormResponse,
  isFieldVisible?: (item: SchemaItem) => boolean
): FormProgress {
  const requiredFields = schema.filter(item => {
    const isRequired = item.display_attributes.isRequired;
    const isVisible = isFieldVisible ? isFieldVisible(item) : true;
    return isRequired && isVisible;
  });
  const totalRequired = requiredFields.length;
  
  const completedFields = requiredFields.filter(item => {
    const value = formResponses[item.unique_id];
    
    // Special handling for checkbox fields with minSelected
    if (item.display_attributes.input_type === 'checkbox' && item.display_attributes.checkbox_options?.minSelected) {
      const minRequired = item.display_attributes.checkbox_options.minSelected;
      if (Array.isArray(value)) {
        return value.length >= minRequired;
      } else if (value && typeof value === 'string' && value.trim() !== '') {
        // Single value case - only complete if minRequired is 1 or less
        return minRequired <= 1;
      }
      return false;
    }
    
    // Default logic for other field types
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value.toString().trim() !== '';
  });
  
  const missingFields = requiredFields.filter(item => {
    const value = formResponses[item.unique_id];
    
    // Special handling for checkbox fields with minSelected
    if (item.display_attributes.input_type === 'checkbox' && item.display_attributes.checkbox_options?.minSelected) {
      const minRequired = item.display_attributes.checkbox_options.minSelected;
      if (Array.isArray(value)) {
        return value.length < minRequired;
      } else if (value && typeof value === 'string' && value.trim() !== '') {
        // Single value case - missing if minRequired is more than 1
        return minRequired > 1;
      }
      return true;
    }
    
    // Default logic for other field types
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return !value || value.toString().trim() === '';
  });
  
  const completedRequired = completedFields.length;
  const percentage = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;
  
  return {
    completed: completedRequired,
    total: totalRequired,
    percentage,
    isComplete: completedRequired === totalRequired,
    requiredFields,
    missingFields
  };
}

/**
 * Get form validation errors for required fields
 * @param schema - Array of schema items
 * @param formResponses - Current form responses
 * @param isFieldVisible - Optional function to check if a field is visible
 * @returns Array of validation error messages
 */
export function getFormValidationErrors(
  schema: SchemaItem[],
  formResponses: FormResponse,
  isFieldVisible?: (item: SchemaItem) => boolean
): string[] {
  const progress = calculateFormProgress(schema, formResponses, isFieldVisible);
  
  if (progress.isComplete) {
    return [];
  }
  
  return progress.missingFields.map(field => {
    const displayName = field.display_attributes.display_name;
    
    // Handle checkbox fields with blank display names
    if (field.display_attributes.input_type === 'checkbox' && (!displayName || displayName.trim() === '')) {
      const blockName = field.display_attributes.block || 'Unknown';
      return `Checkbox field in ${blockName} section is required`;
    }
    
    return `${displayName || 'Field'} is required`;
  });
}

/**
 * Check if form can be submitted (all required fields completed)
 * @param schema - Array of schema items
 * @param formResponses - Current form responses
 * @param isFieldVisible - Optional function to check if a field is visible
 * @returns True if form can be submitted
 */
export function canSubmitForm(
  schema: SchemaItem[],
  formResponses: FormResponse,
  isFieldVisible?: (item: SchemaItem) => boolean
): boolean {
  const progress = calculateFormProgress(schema, formResponses, isFieldVisible);
  return progress.isComplete;
}