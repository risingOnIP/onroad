"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

const HomeNavbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();
  const router = useRouter();

  // Initial fetch for auth user
  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        //this means that the user is not signed in
        setUser(null);
      } else {
        setUser(user);
      }
      setIsLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // Fetch profile (firstName and role) when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { error: getProfileError, data: filteredProfile } = await supabase
          .from("profiles")
          .select("firstName, role")
          .eq("user_id", user.id)
          .single();

        if (getProfileError) {
          console.error("Error getting user name/role:", getProfileError);
          setUserRole(null);
          setUserFirstName(null);
        } else {
          setUserFirstName(filteredProfile.firstName);
          setUserRole(filteredProfile.role);
        }
      } else {
        // Clear profile if no user is signed in
        setUserRole(null);
        setUserFirstName(null);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const handleSignOut = async () => {
    try {
      // Clear user state immediately
      setUser(null);
      // Also sign out on the client side before server action
      await supabase.auth.signOut();
      // Then call the server action which will handle redirect
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
        {/* Left side - Logo and Home link */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/favicon.ico"
              alt="OnRoad"
              width={1741}
              height={559}
              className="h-8 w-auto"
            />
          </Link>
          <Link 
            href="/" 
            className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Home</span>
          </Link>
        </div>

        {/* Right side - Login/User section */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <>
              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                Hi {userFirstName}!
              </span>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${userRole}/workspace`}>Workspace</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="p-2">
                <Link href="/settings" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                asChild 
                variant="ghost" 
                size="sm"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
              >
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button 
                asChild 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default HomeNavbar;