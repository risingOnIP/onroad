"use client";

import React, { useContext, useState } from 'react';

// Import existing components we'll reuse
import FormsSection from './components/FormsSection';
import ClientManagementSection from './components/ClientManagementSection';
import TimelineSection from './components/TimelineSection';
import DealSettingsSection from './components/DealSettingsSection';
import LightningFormsView from './components/LightningFormsView';

// Import context from layout
import { DealPageContext } from './DealPageContext';

// Import UI components for toggle
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';

const DealPage = () => {
  const { 
    state, 
    dealData, 
    dealId, 
    dealSide,
    // Navigation functions
    navigateToForms,
    navigateToClients,
    editForm,
    previewForm,
    goBack,
    // Client management navigation
    editIntake,
    viewResponses,
    previewIntake,
    setClientTab,
    backToClientsList
  } = useContext(DealPageContext);

  // State for Lightning Forms toggle
  const [isLightningMode, setIsLightningMode] = useState(false);

  // Handler to go back to list view
  const goBackToList = () => {
    goBack();
  };


  if (!dealData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Deal Not Found</h3>
          <p className="text-gray-500">The requested deal could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Render content based on current tab and view mode
  const renderMainContent = () => {
    switch (state.currentTab) {
      case 'timeline':
        return (
          <TimelineSection 
            dealId={dealId} 
            onShowForms={navigateToForms}
            onShowClientIntakes={navigateToClients}
            stepStatuses={dealData?.steps_statuses}
          />
        );
        
      case 'forms':
        if (state.viewMode === 'form-editor' && state.selectedFormId) {
          return (
            <FormsSection 
              dealId={dealId}
              selectedFormId={state.selectedFormId}
              viewMode={state.viewMode}
              dealSide={dealSide}
              onBack={goBackToList}
              onEditForm={editForm}
              onPreview={previewForm}
            />
          );
        }
        if (state.viewMode === 'preview' && state.selectedFormId) {
          return (
            <FormsSection 
              dealId={dealId}
              selectedFormId={state.selectedFormId}
              viewMode={state.viewMode}
              dealSide={dealSide}
              onBack={goBackToList}
              onEditForm={editForm}
              onPreview={previewForm}
            />
          );
        }
        if (state.viewMode === 'finalized' && state.selectedFormId) {
          return (
            <FormsSection 
              dealId={dealId}
              selectedFormId={state.selectedFormId}
              viewMode={state.viewMode}
              dealSide={dealSide}
              onBack={goBackToList}
              onEditForm={editForm}
              onPreview={previewForm}
            />
          );
        }
        if (state.viewMode === 'property-editor' && state.selectedPropertyId) {
          return (
            <FormsSection 
          dealId={dealId}
              selectedPropertyId={state.selectedPropertyId}
              viewMode={state.viewMode}
              dealSide={dealSide}
              onBack={goBackToList}
              onEditForm={editForm}
              onPreview={previewForm}
            />
          );
        }
        return (
          <FormsSection 
            dealId={dealId}
            viewMode={state.viewMode}
            dealSide={dealSide}
            onEditForm={editForm}
            onPreview={previewForm}
          />
        );
        
      case 'clients':
        // Based on the current structure, clients only shows ClientManagementSection
        // Pass URL state and navigation functions to ClientManagementSection
        return (
          <ClientManagementSection 
            deal={dealData}
            // URL state props
            editingIntake={state.editingIntake}
            viewingResponses={state.viewingResponses}
            previewingIntake={state.previewingIntake}
            activeTab={state.clientTab || 'all'}
            // Navigation functions
            onEditIntake={editIntake}
            onViewResponses={viewResponses}
            onPreviewIntake={previewIntake}
            onSetActiveTab={setClientTab}
            onBackToList={backToClientsList}
          />
        );
        
      case 'settings':
        return <DealSettingsSection dealId={dealId} dealData={dealData} />;
        
      default:
        return (
          <TimelineSection 
            dealId={dealId} 
            onShowForms={navigateToForms}
            onShowClientIntakes={navigateToClients}
            stepStatuses={dealData?.steps_statuses}
          />
        );
    }
  };

  // If Lightning Mode is enabled, render it outside the normal layout
  if (isLightningMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Toggle Switch for Lightning Mode - Full Width */}
        <div className="absolute top-0 left-0 right-0 z-10 px-6 py-3 bg-white border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label htmlFor="lightning-mode" className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Lightning Forms</span>
            </Label>
            <Switch
              id="lightning-mode"
              checked={isLightningMode}
              onCheckedChange={setIsLightningMode}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
            />
            <span className="text-sm text-gray-500">Fast mode enabled</span>
          </div>
          <span className="text-sm text-gray-500">
            Switch off to return to legacy view
          </span>
        </div>

        {/* Lightning Forms View - Full Screen with top offset */}
        <div className="pt-16 h-full">
          <LightningFormsView dealId={dealId} dealData={dealData} />
        </div>
      </div>
    );
  }

  // Normal layout with sidebars
  return (
    <div className="flex flex-col h-full">
      {/* Toggle Switch for Lightning Mode */}
      <div className="px-6 py-3 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label htmlFor="lightning-mode" className="flex items-center gap-2 cursor-pointer">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Lightning Forms</span>
          </Label>
          <Switch
            id="lightning-mode"
            checked={isLightningMode}
            onCheckedChange={setIsLightningMode}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
          />
          <span className="text-sm text-gray-500">Legacy view</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default DealPage; 