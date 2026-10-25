"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js"; 

export default function ProtectedPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();


      if (user) {
        setUser(user); 
      }
    };

    getUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    try {
      // Clear user state immediately
      setUser(null);
      await supabase.auth.signOut();
      router.push('/auth/login')
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  if (!user) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-xl font-bold mb-4">Protected Page</h1>
      <p>Welcome, {user.email}!</p>
      <button
        onClick={handleSignOut}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
}
