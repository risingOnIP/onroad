"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { signUpServerAction } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [role, setRole] = useState<
    "broker" | "realtor" | "client" | "tenant" | ""
  >("");
  const [error, setError] = useState({ errorTitle: "", errorMessage: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const roles = [
    {
      id: "broker",
      title: "Broker",
      image: "/images/roles/broker-role.avif",
      description: "Clarity and control, simplified",
    },
    {
      id: "realtor",
      title: "Realtor",
      image: "/images/roles/realtor-role.avif",
      description: "Close deals in record time",
    },
  ];


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const role = formData.get("role") as string;
    const brokerLicenseNumber = formData.get("brokerLicenseNumber") as string;

    if (!role) {
      setError({
        errorTitle: "Empty Role",
        errorMessage: "Please select a role below",
      });
      return;
    }
    if (password !== confirmPassword) {
      setError({
        errorTitle: "Password Mismatch",
        errorMessage: "Passwords do not match.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUpServerAction({
        email,
        password,
        firstName,
        lastName,
        role,
        brokerLicenseNumber:
          role === "broker" || role === "realtor"
            ? brokerLicenseNumber
            : undefined,
      });

      if (result?.error) {
        setError({ errorTitle: "Error", errorMessage: result.error });
        setIsLoading(false);
      } else if (result?.success && result?.redirectTo) {
        router.refresh();
        router.push(result.redirectTo);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError({
          errorTitle: "Error",
          errorMessage: error.message || "Error signing up",
        });
      } else {
        setError({
          errorTitle: "Error",
          errorMessage: "An unknown error occurred",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 py-4", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-bold">Sign Up</h1>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {error.errorTitle && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{error.errorTitle}</AlertTitle>
                <AlertDescription>{error.errorMessage}</AlertDescription>
              </Alert> 
            )}

            {/* FIRST NAME */}
            <div className="grid gap-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                name="firstName"
                type="text"
                placeholder="John"
                required
              />
            </div>

            {/* LAST NAME */}
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                name="lastName"
                type="text"
                placeholder="Doe"
                required
              />
            </div>

            {/* EMAIL */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>

            {/* ROLE SELECTION */}
            <div className="grid gap-2">
              <Label>Select Your Role</Label>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {roles.map((roleOption) => (
                  <Card
                    key={roleOption.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary p-2",
                      role === roleOption.id && "border-primary"
                    )}
                    onClick={() => setRole(roleOption.id as typeof role)}
                  >
                    <CardContent className="flex flex-col items-center gap-1 p-2">
                      <div className="relative w-24 h-24 md:w-32">
                        <Image
                          src={roleOption.image}
                          alt={roleOption.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h3 className="font-semibold text-center text-base mt-2">
                        {roleOption.title}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <input type="hidden" name="role" value={role} />
            </div>

            {(role === "broker" || role === "realtor") && (
              <div className="grid gap-2">
                <Label htmlFor="brokerLicenseNumber">
                  Broker License Number
                </Label>
                <Input
                  id="brokerLicenseNumber"
                  name="brokerLicenseNumber"
                  type="text"
                  placeholder="123456"
                  required
                />
              </div>
            )}

            {/* PASSWORD */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer bg-black hover:bg-gray-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
