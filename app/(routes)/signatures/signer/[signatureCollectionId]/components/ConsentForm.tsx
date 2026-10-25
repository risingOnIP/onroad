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
import { SignatureEvent } from "@/components/files/types/realtor";

interface ConsentFormProps {
  signerEmail: string;
  onConsent: (signatureEvents: SignatureEvent[]) => void;
}

export const ConsentForm: React.FC<ConsentFormProps> = ({
  signerEmail,
  onConsent,
}) => {
  const [consent, setConsent] = useState(false);

  const handleConsentSubmit = () => {
    if (!consent) {
      toast.error("Please consent to continue");
      return;
    }

    const consentEvent: SignatureEvent = {
      event: "esign_consent_given",
      sequence: 1,
      timestamp: new Date(Date.now()),
      ip_address: "",
      user_agent: "",
      actor_uuid: "",
      actor_auth_method: "email_otp",
      signer_email: signerEmail,
    };

    onConsent([consentEvent]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <Card className="w-[32rem] shadow">
        <CardHeader>
          <CardTitle className="text-center">E-Signature Consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground space-y-3">
            <p>
              By checking the box below, you consent to use electronic
              signatures. You agree that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Electronic signatures are legally binding</li>
              <li>You can access and retain electronic records</li>
              <li>You may withdraw consent at any time</li>
              <li>
                You may choose a paper copy instead of an electronic
                signature
              </li>
            </ul>
            <p>If you need a paper copy, contact the sender.</p>
          </div>
          <div className="flex items-start space-x-2">
            <input
              id="consent"
              type="checkbox"
              className="mt-1 cursor-pointer"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="consent" className="text-sm text-gray-700">
              I agree to use electronic signatures
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleConsentSubmit}
            disabled={!consent}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            Continue to Document
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};