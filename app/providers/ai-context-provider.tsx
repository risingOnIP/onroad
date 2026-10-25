'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface AIContext {
  userId: string | null;
  userRole: 'realtor' | 'client' | 'broker' | null;
  userEmail: string | null;
  currentDealId: string | null;
  currentFormId: string | null;
  currentClientId: string | null;
  currentPage: string;
  sessionId: string;
  metadata: Record<string, any>;
}

interface AIContextState extends AIContext {
  isLoading: boolean;
  updateContext: (updates: Partial<AIContext>) => void;
  refreshContext: () => Promise<void>;
}

const AIContextContext = createContext<AIContextState | undefined>(undefined);

export function AIContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sessionId] = useState(() => uuidv4());
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<AIContext>({
    userId: null,
    userRole: null,
    userEmail: null,
    currentDealId: null,
    currentFormId: null,
    currentClientId: null,
    currentPage: pathname,
    sessionId,
    metadata: {}
  });

  // Extract IDs from URL
  useEffect(() => {
    const extractIdsFromPath = () => {
      const updates: Partial<AIContext> = { currentPage: pathname };

      // Extract deal ID
      const dealMatch = pathname.match(/\/workspace\/([^\/]+)/);
      if (dealMatch) {
        updates.currentDealId = dealMatch[1];
      }

      // Extract form ID
      const formMatch = pathname.match(/\/forms\/([^\/]+)/);
      if (formMatch) {
        updates.currentFormId = formMatch[1];
      }

      // Extract client ID
      const clientMatch = pathname.match(/\/client\/([^\/]+)/);
      if (clientMatch) {
        updates.currentClientId = clientMatch[1];
      }

      // Extract client intake ID
      const intakeMatch = pathname.match(/\/\[clientintakeid\]|\/client-intake\/([^\/]+)/);
      if (intakeMatch && intakeMatch[1]) {
        updates.metadata = { ...context.metadata, clientIntakeId: intakeMatch[1] };
      }

      setContext(prev => ({ ...prev, ...updates }));
    };

    extractIdsFromPath();
  }, [pathname]);

  // Load user context
  const loadUserContext = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setContext(prev => ({
          ...prev,
          userId: null,
          userRole: null,
          userEmail: null
        }));
        return;
      }

      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email, firstName, lastName')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Failed to load user profile:', profileError);
        return;
      }

      setContext(prev => ({
        ...prev,
        userId: user.id,
        userRole: profile.role as 'realtor' | 'client' | 'broker',
        userEmail: profile.email,
        metadata: {
          ...prev.metadata,
          userName: `${profile.firstName} ${profile.lastName}`
        }
      }));
    } catch (error) {
      console.error('Error loading AI context:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUserContext();
  }, [loadUserContext]);

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        loadUserContext();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserContext]);

  const updateContext = useCallback((updates: Partial<AIContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshContext = useCallback(async () => {
    await loadUserContext();
  }, [loadUserContext]);

  const value: AIContextState = {
    ...context,
    isLoading,
    updateContext,
    refreshContext
  };

  return (
    <AIContextContext.Provider value={value}>
      {children}
    </AIContextContext.Provider>
  );
}

export function useAIContext() {
  const context = useContext(AIContextContext);
  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIContextProvider');
  }
  return context;
}

// Helper hook to get context for AI requests
export function useAIRequestContext() {
  const context = useAIContext();
  
  return {
    context: {
      userId: context.userId,
      userRole: context.userRole,
      userEmail: context.userEmail,
      currentDealId: context.currentDealId,
      currentFormId: context.currentFormId,
      currentClientId: context.currentClientId,
      currentPage: context.currentPage,
      sessionId: context.sessionId,
      metadata: context.metadata
    },
    isReady: !context.isLoading && context.userId !== null && context.userRole !== null
  };
}