// serverActions.ts
"use server";

import { createClient } from "@/utils/supabase/server.server";
import { createProfile } from "@/app/actions/realtor/profile-actions";
import { revalidatePath } from 'next/cache';
import { createBrokerRealtorTetherByBrokerLicense } from "@/app/actions/realtor/broker-tether-actions";

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  brokerLicenseNumber?: string;
}

export async function signUpServerAction(data: SignUpData) {
  const supabase = await createClient();

  try {
    const { data: { user }, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { error: error.message };
    }

    if (!user) {
      return { error: 'Failed to create user' };
    }

    await createProfile({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      broker_license: data.brokerLicenseNumber,
      realtor_license_number: "",
    });


    if (data.role === 'realtor') {
      if (!data.brokerLicenseNumber) {
        return { error: 'Broker license number is required' };
      }
      await createBrokerRealtorTetherByBrokerLicense(data.brokerLicenseNumber);
    }

    
    // Revalidate the layout to update the navigation state
    revalidatePath('/', 'layout');

    // Redirect after successful sign-up
    return { success: true, redirectTo: `/${data.role}/first-sign-in` };
  } catch (error) {
    console.error('Sign up error:', error);
    return { error: 'An unexpected error occurred during sign up' };
  }

  
}


