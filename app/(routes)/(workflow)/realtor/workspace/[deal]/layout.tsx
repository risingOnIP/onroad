// src/app/(workflow)/realtor/workspace/[deal]/layout.tsx
"use client";

import React, { ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import SidebarChat from "./../../workspace/components/sidebar/SidebarChat";
import { getDeal } from "@/app/actions/realtor/deal-actions";
import "../../../../../globals.css";
import { RWDSidebarMain } from "./components_layout/RWDSidebarMain";

// Import context and types from separate file
import { DealPageContext, DealPageContextType, DealPageState, TabMode, ViewMode } from './DealPageContext';

interface Props {
  children: ReactNode;
}

export default function RealtorLayout({ children }: Props) {
  const router = useRouter();
  const { deal: dealId } = useParams();
  const urlLocation = usePathname();
  const searchParams = useSearchParams();
  const [dealSide, setDealSide] = useState<string>("");
  const [dealData, setDealData] = useState<any>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState<boolean>(false);
  const [chatSidebarWidth, setChatSidebarWidth] = useState<number>(336); // Default 21rem = 336px
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Move state management from page.tsx
  const [state, setState] = useState<DealPageState>({
    currentTab: 'timeline',
    viewMode: 'list'
  });
  
  // Track if state has been initialized from URL
  const [isStateInitialized, setIsStateInitialized] = useState(false);
  
  // No longer needed - URL updates are now synchronous

  useEffect(() => {
    if (!dealId) {
      router.push("/realtor/workspace");
      return;
    }

    getDeal(dealId as string)
      .then((d) => {
        setDealSide(d.dealSide);
        setDealData(d);
      })
      .catch(() => {
        router.push("/realtor/workspace");
      });
  }, [dealId, router]);

  // Parameter validation and cleaning rules
  const cleanStateForContext = useCallback((state: DealPageState): DealPageState => {
    const cleanedState: DealPageState = {
      currentTab: state.currentTab,
      viewMode: state.viewMode
    };

    // Tab-specific parameter rules
    const tabParameters = {
      timeline: [] as (keyof DealPageState)[],
      settings: [] as (keyof DealPageState)[],
      forms: ['selectedFormId', 'selectedPropertyId'] as (keyof DealPageState)[],
      clients: ['clientSection', 'clientTab', 'editingIntake', 'viewingResponses', 'previewingIntake', 'selectedClientIntakeId'] as (keyof DealPageState)[]
    };

    // Only keep parameters that belong to the current tab
    const allowedParams = tabParameters[state.currentTab] || [];
    allowedParams.forEach(param => {
      if (state[param] !== undefined) {
        (cleanedState as any)[param] = state[param];
      }
    });

    // Client-specific cleaning: handle mutually exclusive parameter groups
    if (state.currentTab === 'clients') {
      // Default clientSection to 'management' if not specified
      cleanedState.clientSection = state.clientSection || 'management';

      // Mutually exclusive groups within clients tab
      const hasEditMode = state.editingIntake || state.viewingResponses || state.previewingIntake;
      
      if (hasEditMode) {
        // In edit/view/preview mode: clear list-view parameters
        cleanedState.clientTab = undefined;
      } else {
        // In list mode: clear edit-mode parameters and keep clientTab
        cleanedState.editingIntake = undefined;
        cleanedState.viewingResponses = undefined;
        cleanedState.previewingIntake = undefined;
        // Keep clientTab if it was set, otherwise it stays undefined (which is fine)
        if (state.clientTab) {
          cleanedState.clientTab = state.clientTab;
        }
      }
    }

    return cleanedState;
  }, []);

  // Parse URL parameters into state
  const parseUrlToState = useCallback((): DealPageState => {
    const tab = searchParams.get('tab') as TabMode;
    const view = searchParams.get('view') as ViewMode;
    const formId = searchParams.get('formId');
    const clientIntakeId = searchParams.get('clientIntakeId');
    const propertyId = searchParams.get('propertyId');
    const clientSection = searchParams.get('clientSection') as 'management' | 'intakes' | 'portals';
    const clientTab = searchParams.get('clientTab') as 'all' | 'yours' | 'properties';
    const editingIntake = searchParams.get('editingIntake');
    const viewingResponses = searchParams.get('viewingResponses');
    const previewingIntake = searchParams.get('previewingIntake');

    return {
      currentTab: tab && ['timeline', 'clients', 'forms', 'files', 'settings'].includes(tab) ? tab : 'timeline',
      viewMode: view && ['list', 'form-editor', 'client-editor', 'property-editor', 'preview', 'finalized'].includes(view) ? view : 'list',
      selectedFormId: formId || undefined,
      selectedClientIntakeId: clientIntakeId || undefined,
      selectedPropertyId: propertyId || undefined,
      clientSection: clientSection || undefined,
      clientTab: clientTab || undefined,
      editingIntake: editingIntake || undefined,
      viewingResponses: viewingResponses || undefined,
      previewingIntake: previewingIntake || undefined
    };
  }, [searchParams]);

  // Convert state to URL params
  const stateToUrlParams = useCallback((state: DealPageState): URLSearchParams => {
    const params = new URLSearchParams();
    
    // Only add non-default values to keep URLs clean
    if (state.currentTab !== 'timeline') {
      params.set('tab', state.currentTab);
    }
    if (state.viewMode !== 'list') {
      params.set('view', state.viewMode);
    }
    if (state.selectedFormId) {
      params.set('formId', state.selectedFormId);
    }
    if (state.selectedClientIntakeId) {
      params.set('clientIntakeId', state.selectedClientIntakeId);
    }
    if (state.selectedPropertyId) {
      params.set('propertyId', state.selectedPropertyId);
    }
    // Skip clientSection if it's the default 'management'
    if (state.clientSection && state.clientSection !== 'management') {
      params.set('clientSection', state.clientSection);
    }
    if (state.clientTab) {
      params.set('clientTab', state.clientTab);
    }
    if (state.editingIntake) {
      params.set('editingIntake', state.editingIntake);
    }
    if (state.viewingResponses) {
      params.set('viewingResponses', state.viewingResponses);
    }
    if (state.previewingIntake) {
      params.set('previewingIntake', state.previewingIntake);
    }
    
    return params;
  }, []);

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const urlState = parseUrlToState();
    setState(urlState);
    setIsStateInitialized(true);
  }, [parseUrlToState]);

  // URL updates are now synchronous in navigateTo function

  // Navigation functions
  const navigateTo = useCallback((newState: Partial<DealPageState>) => {
    // Merge the new state with current state
    const mergedState = { ...state, ...newState };
    
    // Clean the state to remove invalid parameter combinations
    const cleanedState = cleanStateForContext(mergedState);
    
    // Update URL immediately (synchronously)
    const params = stateToUrlParams(cleanedState);
    const paramString = params.toString();
    const url = paramString ? `${window.location.pathname}?${paramString}` : window.location.pathname;
    
    router.push(url);
    
    // Then update React state with cleaned state
    setState(cleanedState);
  }, [state, cleanStateForContext, stateToUrlParams, router]);

  const goBack = useCallback(() => {
    // If we're in preview mode with a form selected, go to edit mode of the same form
    if (state.viewMode === 'preview' && state.selectedFormId) {
      navigateTo({
        currentTab: 'forms',
        viewMode: 'form-editor',
        selectedFormId: state.selectedFormId
      });
    }
    // If we're in edit mode (form-editor) with a form selected, go to forms list view
    else if (state.viewMode === 'form-editor' && state.selectedFormId) {
      navigateTo({
        currentTab: 'forms',
        viewMode: 'list',
        selectedFormId: undefined
      });
    }
    else if (state.viewMode === 'client-editor' && state.selectedClientIntakeId) {
      navigateTo({
        currentTab: 'clients',
        viewMode: 'list',
        selectedClientIntakeId: undefined
      });
    }
    // Default behavior - use browser back
    else {
      router.back();
    }
  }, [router, state.viewMode, state.selectedFormId, navigateTo]);

  // Quick navigation functions
  const navigateToTimeline = useCallback(() => {
    navigateTo({ 
      currentTab: 'timeline', 
      viewMode: 'list',
      selectedFormId: undefined,
      selectedClientIntakeId: undefined,
      selectedPropertyId: undefined,
      clientSection: undefined,
      clientTab: undefined
    });
  }, [navigateTo]);

  const navigateToForms = useCallback(() => {
    navigateTo({ 
      currentTab: 'forms', 
      viewMode: 'list',
      selectedFormId: undefined,
      selectedClientIntakeId: undefined,
      selectedPropertyId: undefined,
      clientSection: undefined,
      clientTab: undefined
    });
  }, [navigateTo]);

  const navigateToClients = useCallback(() => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'list', 
      clientSection: 'management',
      selectedFormId: undefined,
      selectedClientIntakeId: undefined,
      selectedPropertyId: undefined,
      clientTab: undefined,
      editingIntake: undefined, // Clear intake editing
      viewingResponses: undefined, // Clear response viewing
      previewingIntake: undefined // Clear intake preview
    });
  }, [navigateTo]);

  const navigateToSettings = useCallback(() => {
    navigateTo({ 
      currentTab: 'settings', 
      viewMode: 'list',
      selectedFormId: undefined,
      selectedClientIntakeId: undefined,
      selectedPropertyId: undefined,
      clientSection: undefined,
      clientTab: undefined
    });
  }, [navigateTo]);

  // Form-specific navigation
  const editForm = useCallback((formId: string) => {
    navigateTo({ currentTab: 'forms', viewMode: 'form-editor', selectedFormId: formId });
  }, [navigateTo]);

  const previewForm = useCallback((formId: string) => {
    navigateTo({ currentTab: 'forms', viewMode: 'preview', selectedFormId: formId });
  }, [navigateTo]);

  const finalizeForm = useCallback((formId: string) => {
    navigateTo({ currentTab: 'forms', viewMode: 'finalized', selectedFormId: formId });
  }, [navigateTo]);

  const editProperty = useCallback((propertyId: string) => {
    navigateTo({ currentTab: 'forms', viewMode: 'property-editor', selectedPropertyId: propertyId });
  }, [navigateTo]);

  // Additional navigation helper to go back to forms list
  const backToFormsList = useCallback(() => {
    navigateTo({ 
      currentTab: 'forms', 
      viewMode: 'list',
      selectedFormId: undefined,
      selectedPropertyId: undefined 
    });
  }, [navigateTo]);

  // Client-specific navigation
  const editClientIntake = useCallback((clientIntakeId: string) => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'client-editor', 
      clientSection: 'intakes',
      selectedClientIntakeId: clientIntakeId 
    });
  }, [navigateTo]);

  // Client management navigation
  const editIntake = useCallback((intakeId: string) => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'list', 
      clientSection: 'management',
      editingIntake: intakeId,
      viewingResponses: undefined, // Clear any response viewing
      previewingIntake: undefined // Clear any intake preview
    });
  }, [navigateTo]);

  const viewResponses = useCallback((intakeId: string) => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'list', 
      clientSection: 'management',
      viewingResponses: intakeId,
      editingIntake: undefined, // Clear any intake editing
      previewingIntake: undefined // Clear any intake preview
    });
  }, [navigateTo]);

  const previewIntake = useCallback((intakeId: string) => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'list', 
      clientSection: 'management',
      previewingIntake: intakeId,
      editingIntake: undefined, // Clear any intake editing
      viewingResponses: undefined // Clear any response viewing
    });
  }, [navigateTo]);

  const setClientTab = useCallback((tab: 'all' | 'yours' | 'properties') => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'list', 
      clientSection: 'management',
      clientTab: tab,
      editingIntake: undefined,
      viewingResponses: undefined,
      previewingIntake: undefined
    });
  }, [navigateTo]);

  const backToClientsList = useCallback(() => {
    navigateTo({ 
      currentTab: 'clients', 
      viewMode: 'list',
      clientSection: 'management',
      editingIntake: undefined,
      viewingResponses: undefined,
      previewingIntake: undefined
    });
  }, [navigateTo]);

  // Resizing functionality
  const MIN_SIDEBAR_WIDTH = 280; // Minimum width in pixels
  const MAX_SIDEBAR_WIDTH = 600; // Maximum width in pixels

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const constrainedWidth = Math.min(Math.max(newWidth, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
    setChatSidebarWidth(constrainedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add event listeners for mouse events
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);
  // While we're fetching/validating, show a loading indicator.
  if (!dealId || !dealSide || !isStateInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
      <span>Loading deal…</span>
      </div>
    );
  }

  return (
    <DealPageContext.Provider value={{ 
      state, 
      setState, 
      dealData,
      dealId: dealId as string,
      dealSide,
      // Navigation functions
      navigateTo,
      goBack,
      // Quick navigation functions
      navigateToTimeline,
      navigateToForms,
      navigateToClients,
      navigateToSettings,
      // Form-specific navigation
      editForm,
      previewForm,
      finalizeForm,
      editProperty,
      backToFormsList,
      // Client-specific navigation
      editClientIntake,
      // Client management navigation
      editIntake,
      viewResponses,
      previewIntake,
      setClientTab,
      backToClientsList
    }}>
      <SidebarProvider>
        <div className="flex w-full min-h-screen max-h-screen">
          {/* Left Sidebar */}
          <RWDSidebarMain dealSide={dealSide} dealId={dealId as string} />

          {/* Main content - offset by left sidebar width, with dynamic chat sidebar space */}
          <div 
            className={`flex-1 w-full min-w-0 h-screen flex flex-col ${
              isResizing ? '' : 'transition-all duration-300 ease-in-out'
            }`}
            style={{ 
              marginLeft: "calc(var(--sidebar-width-icon) + 1px)",
              marginRight: isChatCollapsed ? "0" : `${chatSidebarWidth}px`
            }}
          >
            {children}
          </div>

          {/* Right Sidebar (chat) - Fixed position, collapsible and resizable */}
          <div 
            className={`fixed right-0 top-0 h-full ${
              isResizing ? '' : 'transition-transform duration-300 ease-in-out'
            } ${isChatCollapsed ? "translate-x-full" : "translate-x-0"}`} 
            style={{ width: `${chatSidebarWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 w-1 h-full cursor-ew-resize bg-transparent hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors duration-200 z-10"
              onMouseDown={handleMouseDown}
              title="Drag to resize sidebar"
            />
            
            {/* Resize Handle Visual Indicator */}
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-border rounded-r-sm opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            />
            
            <SidebarChat />
          </div>

          {/* Chat Toggle Button - Fixed position with dynamic positioning */}
          <button
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
            className="fixed top-4 z-50 bg-background border border-border rounded-l-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 ease-in-out shadow-md"
            style={{
              right: isChatCollapsed ? "0px" : `${chatSidebarWidth - 16}px`
            }}
            title={isChatCollapsed ? "Show AI Chat" : "Hide AI Chat"}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isChatCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </SidebarProvider>
    </DealPageContext.Provider>
  );
}
