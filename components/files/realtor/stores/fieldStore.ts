import { create } from 'zustand';
import { FormResponse } from '../../types/realtor';

interface FieldState {
  // Core field data
  fields: Map<string, any>;
  
  // Real values for fields with attributes (keyed by attribute.key)
  attributeRealValues: Map<string, any>;
  
  // Field status tracking
  editedFields: Set<string>;
  savingFields: Set<string>;
  savedFields: Set<string>;
  
  // Error tracking
  fieldErrors: Map<string, string>;
  
  // Callback for field changes
  onFieldsChange?: (fields: Map<string, any>) => void;
  
  // Actions
  updateField: (fieldId: string, value: any) => void;
  updateFieldWithAttribute: (fieldId: string, value: any, attributeKey: string, realValue: any) => void;
  batchUpdateFields: (updates: Record<string, any>) => void;
  getField: (fieldId: string) => any;
  getAttributeRealValue: (attributeKey: string) => any;
  setOnFieldsChange: (callback: (fields: Map<string, any>) => void) => void;
  
  // Status actions
  markFieldEdited: (fieldId: string) => void;
  markFieldSaving: (fieldId: string) => void;
  markFieldSaved: (fieldId: string) => void;
  clearFieldStatus: (fieldId: string) => void;
  
  // Error actions
  setFieldError: (fieldId: string, error: string) => void;
  clearFieldError: (fieldId: string) => void;
  
  // Bulk operations
  initializeFields: (formResponse: FormResponse) => void;
  reset: () => void;
  
  // Computed getters
  getFieldStatus: (fieldId: string) => 'idle' | 'edited' | 'saving' | 'saved' | 'error';
  hasUnsavedChanges: () => boolean;
  getUnsavedFields: () => string[];
}

export const useFieldStore = create<FieldState>()(
  (set, get) => ({
  // Initial state
  fields: new Map(),
  attributeRealValues: new Map(),
  editedFields: new Set(),
  savingFields: new Set(),
  savedFields: new Set(),
  fieldErrors: new Map(),
  onFieldsChange: undefined,
  
  // Core field operations
  updateField: (fieldId: string, value: any) => {
    set((state) => {
      const newFields = new Map(state.fields);
      newFields.set(fieldId, value);
      
      const newEditedFields = new Set(state.editedFields);
      newEditedFields.add(fieldId);
      
      const newSavedFields = new Set(state.savedFields);
      // Keep field in savedFields - let priority system handle status display
      
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.delete(fieldId); // Clear error when field is updated
      
      // Call the callback if it exists
      if (state.onFieldsChange) {
        state.onFieldsChange(newFields);
      }
      
      return {
        fields: newFields,
        editedFields: newEditedFields,
        savedFields: newSavedFields,
        fieldErrors: newFieldErrors,
      };
    });
  },
  
  setOnFieldsChange: (callback: (fields: Map<string, any>) => void) => {
    set({ onFieldsChange: callback });
  },
  
  // Update field with attribute real value
  updateFieldWithAttribute: (fieldId: string, value: any, attributeKey: string, realValue: any) => {
    
    set((state) => {
      const newFields = new Map(state.fields);
      newFields.set(fieldId, value);
      
      const newAttributeRealValues = new Map(state.attributeRealValues);
      const oldRealValue = state.attributeRealValues.get(attributeKey);
      newAttributeRealValues.set(attributeKey, realValue);
      
      const newEditedFields = new Set(state.editedFields);
      newEditedFields.add(fieldId);
      
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.delete(fieldId);
      
      if (state.onFieldsChange) {
        state.onFieldsChange(newFields);
      }
      
      
      return {
        fields: newFields,
        attributeRealValues: newAttributeRealValues,
        editedFields: newEditedFields,
        savedFields: state.savedFields,
        fieldErrors: newFieldErrors,
      };
    });
  },
  
  getAttributeRealValue: (attributeKey: string) => {
    return get().attributeRealValues.get(attributeKey);
  },
  
  batchUpdateFields: (updates: Record<string, any>) => {
    set((state) => {
      const newFields = new Map(state.fields);
      const newEditedFields = new Set(state.editedFields);
      const newSavedFields = new Set(state.savedFields);
      const newFieldErrors = new Map(state.fieldErrors);
      
      Object.entries(updates).forEach(([fieldId, value]) => {
        newFields.set(fieldId, value);
        newEditedFields.add(fieldId);
        // Keep field in savedFields - let priority system handle status display
        newFieldErrors.delete(fieldId);
      });
      
      // Call the callback if it exists
      if (state.onFieldsChange) {
        state.onFieldsChange(newFields);
      }
      
      return {
        fields: newFields,
        editedFields: newEditedFields,
        savedFields: newSavedFields,
        fieldErrors: newFieldErrors,
      };
    });
  },
  
  getField: (fieldId: string) => {
    return get().fields.get(fieldId);
  },
  
  // Status operations
  markFieldEdited: (fieldId: string) => {
    set((state) => ({
      editedFields: new Set(state.editedFields).add(fieldId),
      // Keep field in savedFields - let priority system handle status display
    }));
  },
  
  markFieldSaving: (fieldId: string) => {
    set((state) => {
      const newSavingFields = new Set(state.savingFields).add(fieldId);
      const newEditedFields = new Set([...state.editedFields].filter(id => id !== fieldId));
      
      
      return {
        savingFields: newSavingFields,
        editedFields: newEditedFields,
      };
    });
  },
  
  markFieldSaved: (fieldId: string) => {
    set((state) => {
      const newSavingFields = new Set([...state.savingFields].filter(id => id !== fieldId));
      const newSavedFields = new Set(state.savedFields).add(fieldId);
      
      
      return {
        savingFields: newSavingFields,
        savedFields: newSavedFields,
      };
    });
  },
  
  clearFieldStatus: (fieldId: string) => {
    set((state) => ({
      editedFields: new Set([...state.editedFields].filter(id => id !== fieldId)),
      savingFields: new Set([...state.savingFields].filter(id => id !== fieldId)),
      savedFields: new Set([...state.savedFields].filter(id => id !== fieldId)),
    }));
  },
  
  // Error operations
  setFieldError: (fieldId: string, error: string) => {
    set((state) => {
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.set(fieldId, error);
      
      return {
        fieldErrors: newFieldErrors,
        savingFields: new Set([...state.savingFields].filter(id => id !== fieldId)),
      };
    });
  },
  
  clearFieldError: (fieldId: string) => {
    set((state) => {
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.delete(fieldId);
      return { fieldErrors: newFieldErrors };
    });
  },
  
  // Bulk operations
  initializeFields: (formResponse: FormResponse) => {

    set((state) => {
      const newFields = new Map();
      Object.entries(formResponse).forEach(([fieldId, value]) => {
        newFields.set(fieldId, value);
      });
      
      // PRESERVE existing saved status instead of clearing it
      return {
        fields: newFields,
        editedFields: new Set(),
        savingFields: new Set(),
        savedFields: state.savedFields, // Keep existing saved status!
        fieldErrors: new Map(),
      };
    });
  },
  
  reset: () => {
    set({
      fields: new Map(),
      attributeRealValues: new Map(),
      editedFields: new Set(),
      savingFields: new Set(),
      savedFields: new Set(),
      fieldErrors: new Map(),
    });
  },
  
  // Computed getters
  getFieldStatus: (fieldId: string) => {
    const state = get();
    
    const hasError = state.fieldErrors.has(fieldId);
    const isSaving = state.savingFields.has(fieldId);
    const isSaved = state.savedFields.has(fieldId);
    const isEdited = state.editedFields.has(fieldId);
    
    let status: 'idle' | 'edited' | 'saving' | 'saved' | 'error';
    
    if (hasError) status = 'error';
    else if (isSaving) status = 'saving';
    else if (isSaved) status = 'saved';
    else if (isEdited) status = 'edited';
    else status = 'idle';
    
    // Only log status checks for fields that have some status (not idle)

    
    return status;
  },
  
  hasUnsavedChanges: () => {
    const state = get();
    return state.editedFields.size > 0 || state.savingFields.size > 0;
  },
  
  getUnsavedFields: () => {
    const state = get();
    return [...state.editedFields, ...state.savingFields];
  },
}));

// Hook for field-specific operations
export const useField = (fieldId: string) => {
  const store = useFieldStore();
  
  return {
    value: store.getField(fieldId),
    status: store.getFieldStatus(fieldId),
    error: store.fieldErrors.get(fieldId),
    
    setValue: (value: any) => store.updateField(fieldId, value),
    markEdited: () => store.markFieldEdited(fieldId),
    markSaving: () => store.markFieldSaving(fieldId),
    markSaved: () => store.markFieldSaved(fieldId),
    setError: (error: string) => store.setFieldError(fieldId, error),
    clearError: () => store.clearFieldError(fieldId),
    clearStatus: () => store.clearFieldStatus(fieldId),
  };
};

// Safe expression evaluator (duplicated from OptimizedFormInput for use in store)
function evaluateExpression(expression: string | undefined, value: any): any {
  if (!expression || typeof expression !== 'string') {
    return value;
  }
  
  
  try {
    // Create a sandboxed function - built-ins are already available in the scope
    // No need to redefine them which was causing the initialization error
    const func = new Function('value', `
      'use strict';
      try {
        return ${expression};
      } catch (innerError) {
        console.error('[STORE EXPRESSION ERROR]', innerError);
        return arguments[0]; // Return original value on inner error
      }
    `);
    
    const result = func(value);
    return result;
  } catch (error) {
    console.error('[STORE EXPRESSION ERROR] Failed to evaluate:', expression, error);
    return value;
  }
}

// Hook for fields with attributes that need to sync
export const useFieldWithAttribute = (fieldId: string, attributeKey: string | undefined, operation?: any) => {
  const store = useFieldStore();
  
  // Subscribe to the real value if attribute key exists
  const realValue = attributeKey ? 
    useFieldStore(state => {
      const val = state.attributeRealValues.get(attributeKey);
      return val;
    }) : 
    undefined;
  
  // Also subscribe to the field's own value
  const fieldValue = useFieldStore(state => state.fields.get(fieldId));
  
  // Apply operation to get display value
  let displayValue = fieldValue;
  
  if (realValue !== undefined && operation) {
    if (typeof operation === 'function') {
      // Legacy: Function operation
      try {
        displayValue = operation(realValue);
      } catch (error) {
        console.error(`[HOOK DEBUG] Failed to apply operation function for ${fieldId}:`, error);
        displayValue = fieldValue;
      }
    } else if (typeof operation === 'string') {
      // New: String expression evaluation
      displayValue = evaluateExpression(operation, realValue);
    } else {
      displayValue = fieldValue;
    }
  } else if (!realValue) {
    displayValue = fieldValue;
  }
  
  
  return {
    value: displayValue,
    realValue: realValue,
    status: store.getFieldStatus(fieldId),
    error: store.fieldErrors.get(fieldId),
    
    setValue: (value: any) => store.updateField(fieldId, value),
    setValueWithAttribute: (value: any, realValue: any) => 
      attributeKey ? store.updateFieldWithAttribute(fieldId, value, attributeKey, realValue) : store.updateField(fieldId, value),
    markEdited: () => store.markFieldEdited(fieldId),
    markSaving: () => store.markFieldSaving(fieldId),
    markSaved: () => store.markFieldSaved(fieldId),
    setError: (error: string) => store.setFieldError(fieldId, error),
    clearError: () => store.clearFieldError(fieldId),
    clearStatus: () => store.clearFieldStatus(fieldId),
  };
};