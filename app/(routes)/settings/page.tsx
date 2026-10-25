"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Palette, User as UserIcon, Mail, Trash2 } from "lucide-react";
import { deleteAccount, updateProfile } from "@/app/actions/account-actions";

// Color palette for custom theme creation
const colorPalette = [
  { name: "Red", value: "0.577 0.245 27.325", preview: "#dc2626" },
  { name: "Orange", value: "0.65 0.2 65", preview: "#ea580c" },
  { name: "Amber", value: "0.828 0.189 84.429", preview: "#d97706" },
  { name: "Yellow", value: "0.8 0.18 90", preview: "#ca8a04" },
  { name: "Lime", value: "0.7 0.2 120", preview: "#65a30d" },
  { name: "Green", value: "0.646 0.222 142.495", preview: "#16a34a" },
  { name: "Emerald", value: "0.6 0.2 155", preview: "#059669" },
  { name: "Teal", value: "0.6 0.15 175", preview: "#0d9488" },
  { name: "Cyan", value: "0.65 0.15 195", preview: "#0891b2" },
  { name: "Sky", value: "0.7 0.12 220", preview: "#0284c7" },
  { name: "Blue", value: "0.6 0.118 184.704", preview: "#2563eb" },
  { name: "Indigo", value: "0.55 0.15 250", preview: "#4f46e5" },
  { name: "Violet", value: "0.6 0.2 280", preview: "#7c3aed" },
  { name: "Purple", value: "0.65 0.18 300", preview: "#9333ea" },
  { name: "Fuchsia", value: "0.7 0.25 320", preview: "#c026d3" },
  { name: "Pink", value: "0.75 0.2 350", preview: "#db2777" },
  { name: "Rose", value: "0.7 0.22 10", preview: "#e11d48" },
  { name: "Gray", value: "0.554 0.046 257.417", preview: "#6b7280" },
  { name: "Slate", value: "0.5 0.05 260", preview: "#64748b" },
  { name: "Zinc", value: "0.55 0.02 265", preview: "#71717a" },
];

// Theme presets - using oklch color space to match globals.css
const themePresets = {
  default: {
    name: "Default",
    primary: "0.208 0.042 265.755",
    secondary: "0.968 0.007 247.896",
    accent: "0.968 0.007 247.896",
    preview: { primary: "#1f2937", secondary: "#f3f4f6", accent: "#f3f4f6" }
  },
  ocean: {
    name: "Ocean Blue",
    primary: "0.6 0.118 184.704",
    secondary: "0.7 0.1 200",
    accent: "0.65 0.15 190",
    preview: { primary: "#0284c7", secondary: "#7dd3fc", accent: "#38bdf8" }
  },
  forest: {
    name: "Forest Green",
    primary: "0.5 0.15 140",
    secondary: "0.6 0.1 135",
    accent: "0.55 0.12 145",
    preview: { primary: "#16a34a", secondary: "#86efac", accent: "#4ade80" }
  },
  sunset: {
    name: "Sunset Orange",
    primary: "0.65 0.2 65",
    secondary: "0.7 0.15 60",
    accent: "0.6 0.18 55",
    preview: { primary: "#ea580c", secondary: "#fdba74", accent: "#fb923c" }
  },
  purple: {
    name: "Royal Purple",
    primary: "0.6 0.2 280",
    secondary: "0.7 0.15 285",
    accent: "0.65 0.18 275",
    preview: { primary: "#7c3aed", secondary: "#c4b5fd", accent: "#a78bfa" }
  },
  rose: {
    name: "Rose Gold",
    primary: "0.7 0.22 10",
    secondary: "0.75 0.15 15",
    accent: "0.8 0.18 5",
    preview: { primary: "#e11d48", secondary: "#fda4af", accent: "#fb7185" }
  },
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [mounted, setMounted] = useState(false);
  const [customTheme, setCustomTheme] = useState({
    primary: "0.208 0.042 265.755",
    secondary: "0.968 0.007 247.896",
    accent: "0.968 0.007 247.896",
  });
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Ensure component is mounted before showing theme-dependent UI
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);
      setEmail(user.email || "");

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("firstName, lastName, role")
        .eq("user_id", user.id)
        .single();

      if (profile && !profileError) {
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setRole(profile.role || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await updateProfile({
        firstName,
        lastName,
        email: email !== user.email ? email : undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.message);
        if (result.requiresEmailVerification) {
          // Optionally refresh user data after a delay
          setTimeout(fetchUserData, 2000);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Account deleted successfully");
        // The server action will redirect automatically
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  const applyThemePreset = (presetKey: string) => {
    if (!presetKey) return;
    
    const preset = themePresets[presetKey as keyof typeof themePresets];
    if (preset) {
      applyThemeColors(preset.primary, preset.secondary, preset.accent);
      setSelectedPreset(presetKey);
      setShowCustomTheme(false);
      toast.success(`Applied ${preset.name} theme`);
      
      // Store theme preference in localStorage
      localStorage.setItem("theme-preset", presetKey);
      localStorage.removeItem("custom-theme");
    }
  };

  const applyThemeColors = (primary: string, secondary: string, accent: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", `oklch(${primary})`);
    root.style.setProperty("--secondary", `oklch(${secondary})`);
    root.style.setProperty("--accent", `oklch(${accent})`);
    
    // Update foreground colors for better contrast
    root.style.setProperty("--primary-foreground", "oklch(0.984 0.003 247.858)");
    root.style.setProperty("--secondary-foreground", "oklch(0.208 0.042 265.755)");
    root.style.setProperty("--accent-foreground", "oklch(0.208 0.042 265.755)");
  };

  const applyCustomTheme = () => {
    applyThemeColors(customTheme.primary, customTheme.secondary, customTheme.accent);
    setSelectedPreset("");
    toast.success("Applied custom theme");
    
    // Store custom theme in localStorage
    localStorage.setItem("custom-theme", JSON.stringify(customTheme));
    localStorage.removeItem("theme-preset");
  };

  const selectColor = (colorType: "primary" | "secondary" | "accent", colorValue: string) => {
    setCustomTheme(prev => ({
      ...prev,
      [colorType]: colorValue
    }));
  };

  // Load saved theme preset or custom theme on mount
  useEffect(() => {
    if (mounted) {
      const savedPreset = localStorage.getItem("theme-preset");
      const savedCustomTheme = localStorage.getItem("custom-theme");
      
      if (savedCustomTheme) {
        try {
          const customThemeData = JSON.parse(savedCustomTheme);
          setCustomTheme(customThemeData);
          setShowCustomTheme(true);
          applyThemeColors(customThemeData.primary, customThemeData.secondary, customThemeData.accent);
        } catch (error) {
          console.error("Failed to load custom theme:", error);
        }
      } else if (savedPreset && savedPreset !== selectedPreset) {
        setSelectedPreset(savedPreset);
        applyThemePreset(savedPreset);
      }
    }
  }, [mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the website looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Theme Presets */}
            <div className="space-y-4">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant={selectedPreset === key ? "default" : "outline"}
                    onClick={() => applyThemePreset(key)}
                    className="h-auto p-3 flex flex-col items-start space-y-2"
                  >
                    <div className="flex w-full justify-between items-center">
                      <span className="text-sm font-medium">{preset.name}</span>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: preset.preview.primary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: preset.preview.secondary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: preset.preview.accent }}
                        />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Custom Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Create your own color combination
                </p>
              </div>
              <Button
                variant={showCustomTheme ? "default" : "outline"}
                onClick={() => setShowCustomTheme(!showCustomTheme)}
              >
                Customize
              </Button>
            </div>

            {/* Custom Theme Color Picker */}
            {showCustomTheme && (
              <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
                {["primary", "secondary", "accent"].map((colorType) => (
                  <div key={colorType} className="space-y-3">
                    <Label className="capitalize">{colorType} Color</Label>
                    <div className="grid grid-cols-10 gap-2">
                      {colorPalette.map((color) => (
                        <Button
                          key={`${colorType}-${color.name}`}
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 border-2"
                          style={{ 
                            backgroundColor: color.preview,
                            borderColor: customTheme[colorType as keyof typeof customTheme] === color.value ? '#000' : 'transparent'
                          }}
                          onClick={() => selectColor(colorType as "primary" | "secondary" | "accent", color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="flex space-x-2 pt-4">
                  <Button onClick={applyCustomTheme} className="flex-1">
                    Apply Custom Theme
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomTheme(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing and make UI more compact
                </p>
              </div>
              <Switch
                id="compact-mode"
                onCheckedChange={(checked) => {
                  document.documentElement.classList.toggle("compact", checked);
                  localStorage.setItem("compact-mode", checked ? "true" : "false");
                  toast.success(checked ? "Compact mode enabled" : "Compact mode disabled");
                }}
                defaultChecked={localStorage.getItem("compact-mode") === "true"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <p className="text-sm text-muted-foreground">
                Changing your email will require verification
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <p className="text-sm font-medium">{role || "Not set"}</p>
              <p className="text-sm text-muted-foreground">
                Contact support to change your role
              </p>
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all of your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAccountDeletion}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 