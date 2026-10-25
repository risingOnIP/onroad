"use server";

import { createClient } from "@/utils/supabase/server.server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteAccount() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "User not found" };
  }

  try {
    // Delete user profile data first
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      return { error: "Failed to delete profile data" };
    }

    // Delete related data (add more tables as needed)
    // For example: delete user's deals, forms, etc.
    
    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error("Error signing out:", signOutError);
      return { error: "Failed to sign out" };
    }

    // Note: Actual user deletion from auth.users table requires admin privileges
    // This would typically be handled by a separate admin API or scheduled job
    // For now, we'll just sign out the user and delete their profile data

    revalidatePath("/");
    redirect("/");
    
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updateProfile(data: {
  firstName: string;
  lastName: string;
  email?: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "User not found" };
  }


  try {
    // Update profile data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (profileError) {
      return { error: "Failed to update profile" };
    }

    // Update email if changed
    if (data.email && data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (emailError) {
        return { error: "Failed to update email" };
      }

      return { 
        success: true, 
        requiresEmailVerification: true,
        message: "Profile updated! Please check your email to confirm the email change." 
      };
    }

    revalidatePath("/settings");
    return { success: true, message: "Profile updated successfully!" };
    
  } catch (error) {
    console.error("Unexpected error during profile update:", error);
    return { error: "An unexpected error occurred" };
  }
} 