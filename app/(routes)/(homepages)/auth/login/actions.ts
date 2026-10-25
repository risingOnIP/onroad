'use server';

import { createClient } from '@/utils/supabase/server.server';
import { revalidatePath } from 'next/cache';

interface LoginData {
  email: string;
  password: string;
}

export async function login(data: LoginData) {
  const supabase = await createClient();

  try {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      return { error: signInError.message };
    }

    if (!authData.user) {
      return { error: 'Failed to sign in user' };
    }

  
    // Get user's role from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      return { error: profileError.message };
    }
    revalidatePath('/protected', 'layout')

    // Redirect based on role
    if (profileData.role === 'realtor') {
      return { success: true, redirectTo: '/realtor/workspace' };
    } else if (profileData.role === 'client') {
      return { success: true, redirectTo: '/client/dashboard' };
    } else if (profileData.role === 'broker') {
      return { success: true, redirectTo: '/broker/workspace' };
    } else {
      return { success: true, redirectTo: '/workspace' };
    }

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred during login' };
  }
} 