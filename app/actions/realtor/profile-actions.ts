'use server'

import { createClient } from '@/utils/supabase/server.server'
import { getAuthToken } from '../general'
import { Profile } from '@/components/files/types/realtor';

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL

export async function createProfile(data: Omit<Profile, 'created_at'| 'user_id'| 'broker_license'> & Partial<Pick<Profile, 'broker_license'>>) {
  
  const supabase = await createClient();

  // First create the profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert([
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        broker_license: data.broker_license,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // If this is a realtor, update any existing tethers with just their name (not ID)
  // The realtor_id will only be added when they accept the tether
  if (data.role === 'realtor' && profile) {
    const fullName = `${data.firstName} ${data.lastName}`;
    
    // Update any tethers that have this email but missing realtor_full_name
    const { error: tetherError } = await supabase
      .from('brokerRealtorTether')
      .update({
        realtor_full_name: fullName
      })
      .eq('realtor_email', data.email)
      .is('realtor_full_name', null);

    if (tetherError) {
      console.error('Error updating tethers with new realtor name:', tetherError);
      // Don't throw error - profile creation succeeded, tether update is secondary
    }
  }
}

export async function getProfile(role: string) {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${API_BASE_URL}/profiles/${role}`,  {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })


    if (!response.ok) {

      
      // throw new Error('Failed to fetch profile' )
    }

    const result = (await response.json()) as Profile;
    return result;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

