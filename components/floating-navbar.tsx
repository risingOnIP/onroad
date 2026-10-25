"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Home, Info, Briefcase, MessageSquare, Settings, Users } from "lucide-react";

interface NavItem {
  name: string;
  link: string;
  icon?: React.ReactNode;
}

export const HomeNavbar = () => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();
  const router = useRouter();

  // Handle scroll visibility
  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(true);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  // Initial fetch for auth user
  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
      } else {
        setUser(user);
      }
      setIsLoading(false);
    };
    
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // Fetch profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { error: getProfileError, data: filteredProfile } = await supabase
          .from('profiles')
          .select('firstName, role')
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
        setUserRole(null);
        setUserFirstName(null);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const handleSignOut = async () => {
    try {
      setUser(null);
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems: NavItem[] = [
    {
      name: "Home",
      link: "/",
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: "About",
      link: "/about",
      icon: <Info className="h-4 w-4" />,
    },
    {
      name: "Services",
      link: "/services",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      name: "Testimonials",
      link: "/testimonials",
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: "Contact",
      link: "/contact",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex fixed top-6 inset-x-0 mx-auto border border-gray-200 rounded-full bg-white/80 backdrop-blur-md shadow-lg z-[5000] px-6 py-3 items-center justify-between",
          "max-w-5xl"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-4">
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={1741}
            height={559}
            className="h-6 w-auto"
          />
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center space-x-2">
          {navItems.map((navItem, idx) => (
            <Link
              key={`link=${idx}`}
              href={navItem.link}
              className={cn(
                "relative text-gray-700 items-center flex space-x-1 hover:text-emerald-600 transition-colors px-3 py-2 text-sm font-medium"
              )}
            >
              <span className="block lg:hidden">{navItem.icon}</span>
              <span className="hidden sm:block">{navItem.name}</span>
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-3 ml-4">
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <>
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                Hi {userFirstName}!
              </span>
              <Link href={`/${userRole}/workspace`}>
                <Button size="sm" variant="ghost" className="text-sm">
                  Workspace
                </Button>
              </Link>
              <Link href="/settings">
                <Button size="sm" variant="ghost" className="p-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                size="sm"
                variant="outline" 
                onClick={handleSignOut}
                className="text-sm"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost" className="text-sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};