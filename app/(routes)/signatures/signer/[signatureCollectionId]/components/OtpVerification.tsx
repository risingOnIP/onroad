import React, { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { requestOtp, verifyOtp } from "@/app/actions/jwt/signing-actions";

interface OtpVerificationProps {
  signatureCollectionId: string;
  signerEmail: string;
  onVerified: (token: string) => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  signatureCollectionId,
  signerEmail,
  onVerified,
}) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await verifyOtp(signatureCollectionId, signerEmail, code);
      onVerified(res.token);
    } catch (err: any) {
      toast.error(
        err?.message === "Bad code" ? "Invalid OTP" : "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendCodeClicked = () => {
    if (resendCooldown) return;
    setResendCooldown(5);
    requestOtp(signatureCollectionId)
      .then(() => {
        toast.success("Verification code resent");
        const timer = setInterval(
          () =>
            setResendCooldown((s) => {
              if (s <= 1) clearInterval(timer);
              return s - 1;
            }),
          1000
        );
      })
      .catch((e) => toast.error(e.message));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <Card className="w-[22rem] shadow">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col items-center">
          <p className="text-center text-sm text-muted-foreground">
            Enter the 6-digit code sent to
            <br />
            <span className="font-medium">{signerEmail}</span>
          </p>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            className="flex justify-center"
          >
            <InputOTPGroup className="flex justify-center">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
          <button
            type="button"
            disabled={!!resendCooldown}
            onClick={onResendCodeClicked}
            className={`text-xs ${
              resendCooldown
                ? "text-gray-400 cursor-not-allowed"
                : "text-muted-foreground hover:underline"
            }`}
          >
            {resendCooldown
              ? `Resend in ${resendCooldown}s`
              : "Resend Code"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};