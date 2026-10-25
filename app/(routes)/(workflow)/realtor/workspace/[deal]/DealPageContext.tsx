"use client";

import React from "react";

// Move the context and types from layout.tsx
export type TabMode = 'timeline' | 'clients' | 'forms' | 'settings';
export type ViewMode = 'list' | 'form-editor' | 'client-editor' | 'property-editor' | 'preview' | 'finalized';

export interface DealPageState {
  currentTab: TabMode;
  viewMode: ViewMode;
  selectedFormId?: string;
  selectedClientIntakeId?: string;
  selectedPropertyId?: string;
  clientSection?: 'management' | 'intakes' | 'portals';
  clientTab?: 'all' | 'yours' | 'properties'; // For ClientManagementSection internal navigation
  editingIntake?: string; // For ClientManagementSection intake editing
  viewingResponses?: string; // For ClientManagementSection response viewing
  previewingIntake?: string; // For ClientManagementSection intake preview
}

// Create a context to share state with sidebar components
export interface DealPageContextType {
  state: DealPageState;
  setState: React.Dispatch<React.SetStateAction<DealPageState>>;
  dealData: any;
  dealId: string;
  dealSide: string;
  // Navigation functions
  navigateTo: (newState: Partial<DealPageState>) => void;
  goBack: () => void;
  // Quick navigation functions
  navigateToTimeline: () => void;
  navigateToForms: () => void;
  navigateToClients: () => void;
  navigateToSettings: () => void;
  // Form-specific navigation
  editForm: (formId: string) => void;
  previewForm: (formId: string) => void;
  finalizeForm: (formId: string) => void;
  editProperty: (propertyId: string) => void;
  backToFormsList: () => void;
  // Client-specific navigation
  editClientIntake: (clientIntakeId: string) => void;
  editIntake: (intakeId: string) => void;
  viewResponses: (intakeId: string) => void;
  previewIntake: (intakeId: string) => void;
  setClientTab: (tab: 'all' | 'yours' | 'properties') => void;
  backToClientsList: () => void;
}

export const DealPageContext = React.createContext<DealPageContextType>({
  state: { currentTab: 'timeline', viewMode: 'list' },
  setState: () => {},
  dealData: null,
  dealId: '',
  dealSide: '',
  navigateTo: () => {},
  goBack: () => {},
  navigateToTimeline: () => {},
  navigateToForms: () => {},
  navigateToClients: () => {},
  navigateToSettings: () => {},
  editForm: () => {},
  previewForm: () => {},
  finalizeForm: () => {},
  editProperty: () => {},
  backToFormsList: () => {},
  editClientIntake: () => {},
  editIntake: () => {},
  viewResponses: () => {},
  previewIntake: () => {},
  setClientTab: () => {},
  backToClientsList: () => {}
});