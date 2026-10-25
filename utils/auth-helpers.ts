import { createClient } from "@/utils/supabase/server.server";

interface AuthenticatedUser {
  id: string;
  email: string;
  user_metadata?: any;
}

interface AuthCheckResult<T = AuthenticatedUser> {
  user: T | null;
  error: string | null;
}

/**
 * Centralized authentication check for server actions
 * This eliminates the need to repeat the same auth pattern across multiple actions
 */
export async function checkAuth(): Promise<AuthCheckResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("checkAuth - Supabase auth error:", error);
      return {
        user: null,
        error: "Unauthorized"
      };
    }

    if (!user) {
      return {
        user: null,
        error: "Unauthorized"
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email || "",
        user_metadata: user.user_metadata
      },
      error: null
    };
  } catch (error) {
    console.error("checkAuth - Exception:", error);
    return {
      user: null,
      error: "Authentication failed"
    };
  }
}

/**
 * Higher-order function that wraps server actions with authentication
 * Usage: export const myAction = withAuth(async (user, params) => { ... })
 */
export function withAuth<TParams extends any[], TReturn>(
  action: (user: AuthenticatedUser, ...args: TParams) => Promise<TReturn>
) {
  return async (...args: TParams): Promise<TReturn | { error: string }> => {
    const { user, error } = await checkAuth();
    
    if (error || !user) {
      return { error: error || "Unauthorized" } as any;
    }

    try {
      return await action(user, ...args);
    } catch (error) {
      console.error("withAuth - Action failed:", error);
      return { error: error instanceof Error ? error.message : "Action failed" } as any;
    }
  };
}

/**
 * Check if a user has a specific role
 */
export async function checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    console.error("Failed to check user role:", error);
    return false;
  }

  return profile.role === requiredRole;
}

/**
 * Higher-order function that wraps server actions with role-based authentication
 */
export function withRoleAuth<TParams extends any[], TReturn>(
  requiredRole: string,
  action: (user: AuthenticatedUser, ...args: TParams) => Promise<TReturn>
) {
  return async (...args: TParams): Promise<TReturn | { error: string }> => {
    const { user, error } = await checkAuth();
    
    if (error || !user) {
      return { error: error || "Unauthorized" } as any;
    }

    const hasRole = await checkUserRole(user.id, requiredRole);
    if (!hasRole) {
      return { error: "Insufficient permissions" } as any;
    }

    try {
      return await action(user, ...args);
    } catch (error) {
      console.error("Action failed:", error);
      return { error: error instanceof Error ? error.message : "Action failed" } as any;
    }
  };
}