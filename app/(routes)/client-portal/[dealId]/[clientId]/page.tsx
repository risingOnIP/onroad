"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import {
  FileText,
  PenTool,
  MapPin,
  Calendar,
  Eye,
  ChevronRight,
  Loader2,
  Download,
  Clock,
  CheckCircle,
  User,
  UserCheck,
  FilePlus,
  Users,
} from "lucide-react";
import { Form } from "@/components/files/types/realtor";
import { isCurrentStepSigner, getUserActionType } from "./partyportal-actions";
import { formTypeDisplay } from "@/app/(routes)/(workflow)/realtor/workspace/[deal]/components/PreviewSection";

interface ClientIntake {
  id: string;
  form_name: string;
  created_at: string;
  party_response?: any;
}

interface SignatureCollection {
  id: string;
  form_names: string[];
  created_at: string;
  finalized: boolean;
}

interface FormWithSignatures extends Form {
  dealOptions?: {
    id: string;
    address: string;
  };
  signatures: any[];
  userSignature?: any;
  isUserSigner: boolean;
  hasSignatures: boolean;
  actionAs?: string; // "signer" or "delegator"
}

interface FormsData {
  completed: FormWithSignatures[];
  inProgress: FormWithSignatures[];
  upcoming: FormWithSignatures[];
}

interface IntakeStatus {
  hasPublishedIntakes: boolean;
  totalPublishedIntakes: number;
  pendingCount: number;
  completedCount: number;
}

interface PortalData {
  deal: {
    id: string;
    dealName: string;
    dealSide: string;
    isActive: boolean;
  };
  pendingIntakes: ClientIntake[];
  pendingSignatures: SignatureCollection[];
  formsData: FormsData;
  clientEmail: string;
  intakeStatus: IntakeStatus;
}

// Updated with InputOTP component and clientId parameter
export default function ClientPortalPage() {
  const params = useParams();

  // Safely extract and validate dealId
  let dealId: string;
  if (typeof params.dealId === "string") {
    dealId = params.dealId;
  } else if (Array.isArray(params.dealId)) {
    dealId = params.dealId[0];
  } else {
    dealId = String(params.dealId || "");
  }

  // Safely extract and validate clientId
  let clientId: string;
  if (typeof params.clientId === "string") {
    clientId = params.clientId;
  } else if (Array.isArray(params.clientId)) {
    clientId = params.clientId[0];
  } else if (typeof params.clientId === "object" && params.clientId !== null) {
    if (
      "id" in params.clientId &&
      typeof (params.clientId as any).id === "string"
    ) {
      clientId = (params.clientId as any).id;
    } else {
      clientId = String(params.clientId);
    }
  } else {
    clientId = String(params.clientId || "");
  }

  const [step, setStep] = useState<"otp" | "portal">("otp");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [categorizingForms, setCategorizingForms] = useState(false);

  const NEXT_PUBLIC_EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

  // Client portal specific PDF access function
  const getClientPortalPdfUrl = async (
    pdfFileName: string
  ): Promise<string> => {
    if (typeof pdfFileName !== "string") {
      throw new Error("Invalid PDF filename - must be a string");
    }

    if (pdfFileName.includes("[object Object]")) {
      throw new Error("Malformed PDF filename detected");
    }

    if (!token) throw new Error("No portal token available");

    const url = `${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/party-portal/${dealId}/${clientId}/pdf/${encodeURIComponent(
      pdfFileName
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get PDF URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  };

  // Auto-request OTP and get client email on page load
  useEffect(() => {
    const savedToken = localStorage.getItem(
      `portal_token_${dealId}_${clientId}`
    );
    if (savedToken) {
      setToken(savedToken);
      // Also store with the key expected by signature pages
      localStorage.setItem("partyPortalToken", savedToken);
      loadPortalData(savedToken);
      return;
    }

    // Auto-request OTP using clientId
    requestOTPForClient();
  }, [dealId, clientId]);

  const requestOTPForClient = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/party-portal/${dealId}/${clientId}/otp/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to parse error response" }));

        if (response.status === 404) {
          // More specific error message for debugging
          toast.error(`Client/deal association not found. Deal: ${dealId}, Client: ${clientId}`);
          console.error("404 Error:", error);
          return;
        }
        throw new Error(error.error || `Failed to send OTP (Status: ${response.status})`);
      }

      const data = await response.json();
      if (!data.email) {
        throw new Error("No email returned from server");
      }
      
      setEmail(data.email);
      toast.success("Verification code sent. Please check your email.");
    } catch (error) {
      console.error("OTP Request Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send verification code"
      );
      // Retry once after 60 seconds if it's not a 404
      if (error instanceof Error && !error.message.includes("404")) {
        setTimeout(() => {
          requestOTPForClient();
        }, 60000);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/party-portal/${dealId}/${clientId}/otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code: otp }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid verification code");
      }

      const { token: newToken } = await response.json();
      setToken(newToken);
      localStorage.setItem(`portal_token_${dealId}_${clientId}`, newToken);
      // Also store with the key expected by signature pages
      localStorage.setItem("partyPortalToken", newToken);

      await loadPortalData(newToken);
      setStep("portal");
    } catch (error: any) {
      toast.error(
        error?.message === "Bad code" ? "Invalid OTP" : "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendCodeClicked = () => {
    if (resendCooldown) return;
    setResendCooldown(5);
    setLoading(true);
    fetch(
      `${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/party-portal/${dealId}/${clientId}/otp/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to resend code");
        }
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
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  const loadPortalData = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/party-portal/${dealId}/${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          // Token expired, restart auth flow
          localStorage.removeItem(`portal_token_${dealId}_${clientId}`);
          setToken(null);
          setStep("otp");
          requestOTPForClient();
          return;
        }
        throw new Error(error.error || "Failed to load portal data");
      }

      const data = await response.json();

      // Categorize forms based on isCurrentStepSigner
      if (
        data.formsData &&
        data.formsData.inProgress &&
        data.formsData.inProgress.length > 0
      ) {
        setCategorizingForms(true);
        const categorizedForms = await categorizeForms(
          data.formsData.inProgress,
          data.clientEmail,
          authToken
        );
        data.formsData = {
          ...data.formsData,
          inProgress: categorizedForms.inProgress,
          upcoming: categorizedForms.upcoming,
        };
        setCategorizingForms(false);
      } else {
        // Initialize empty upcoming array if no forms to categorize
        data.formsData = {
          ...data.formsData,
          upcoming: [],
        };
      }

      setPortalData(data);
      setStep("portal");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load portal data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to categorize forms based on isCurrentStepSigner
  const categorizeForms = async (
    inProgressForms: FormWithSignatures[],
    clientEmail: string,
    token: string
  ) => {
    const inProgress: FormWithSignatures[] = [];
    const upcoming: FormWithSignatures[] = [];

    for (const form of inProgressForms) {
      try {
        const [isCurrentSigner, actionTypeResult] = await Promise.all([
          isCurrentStepSigner(form.id, clientEmail, token),
          getUserActionType(form.id, clientEmail, token),
        ]);

        // Add actionAs to the form object
        const formWithActionAs = {
          ...form,
          actionAs: actionTypeResult.actionAs,
        };

        if (isCurrentSigner) {
          inProgress.push(formWithActionAs);
        } else {
          upcoming.push(formWithActionAs);
        }
      } catch (error) {
        console.error("error", error);
        // Default to upcoming if we can't determine signer status
        upcoming.push(form);
      }
    }

    return { inProgress, upcoming };
  };

  const navigateToIntake = (intakeId: string) => {
    // Store the current portal token for when they return
    if (token) {
      localStorage.setItem(`portal_token_${dealId}_${clientId}`, token);
      localStorage.setItem("partyPortalToken", token);
    }
    window.open(`/client-intake/${intakeId}`, "_blank");
  };

  const navigateToSignature = (signatureId: string) => {
    // Store the current portal token for when they return
    if (token) {
      localStorage.setItem(`portal_token_${dealId}_${clientId}`, token);
      localStorage.setItem("partyPortalToken", token);
    }
    window.open(`/signatures/signer/${signatureId}`, "_blank");
  };

  const navigateToDelegation = (signatureId: string) => {
    // Store the current portal token for when they return
    if (token) {
      localStorage.setItem(`portal_token_${dealId}_${clientId}`, token);
      localStorage.setItem("partyPortalToken", token);
    }
    window.open(`/signatures/delegator/${signatureId}`, "_blank");
  };

  const viewPdf = async (
    form: FormWithSignatures,
    viewOnly: boolean = false
  ) => {
    if (form.finalized_pdf) {
      // For finalized PDFs, use the signatures view-pdf page with any signature collection ID
      if (form.signatures && form.signatures.length > 0) {
        const firstSignature = form.signatures[0];
        if (firstSignature.id && typeof firstSignature.id === "string") {
          window.open(`/signatures/view-pdf/${firstSignature.id}`, "_blank");
        } else {
          toast.error("Invalid signature reference. Cannot view PDF.");
          return;
        }
      } else {
        toast.error("Unable to view this PDF. No signature data available.");
        return;
      }
    } else if (!viewOnly && form.isUserSigner && form.userSignature) {
      // Check if user should delegate or sign
      if (form.actionAs === "delegator") {
        navigateToDelegation(form.userSignature.id);
      } else {
        // Default to signing for backwards compatibility
        navigateToSignature(form.userSignature.id);
      }
    } else if (form.signatures.length > 0) {
      // For non-signers or view-only mode, open view-only PDF viewer using any signature collection
      window.open(`/signatures/view-pdf/${form.signatures[0].id}`, "_blank");
    } else {
      toast.error("No PDF available to view");
    }
  };

  const downloadPdf = async (pdfFileName: string, formType: string) => {
    try {
      const downloadUrl = await getClientPortalPdfUrl(pdfFileName);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${formType}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error getting PDF download URL:", error);
      toast.error("Unable to download PDF. Please try again.");
    }
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-6">
        <Card className="w-[22rem] shadow">
          <CardHeader>
            <CardTitle className="text-center">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col items-center">
            {loading && !email ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading client information...
              </div>
            ) : email ? (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                  <br />
                  <span className="font-medium">{email}</span>
                </p>
                <div className="w-full flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-red-600">
                Failed to load client information. Please try refreshing the
                page.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={verifyOTP}
              disabled={isVerifying || otp.length !== 6 || !email}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
            <button
              type="button"
              disabled={!!resendCooldown || !email}
              onClick={onResendCodeClicked}
              className={`text-xs ${
                resendCooldown || !email
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-muted-foreground hover:underline"
              }`}
            >
              {resendCooldown ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {portalData.deal.dealName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={portalData.deal.isActive ? "default" : "secondary"}
                >
                  {portalData.deal.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{portalData.deal.dealSide}</Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Logged in as:</p>
              <p className="font-medium">{portalData.clientEmail}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Intake Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus className="h-5 w-5" />
                Client Intake Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!portalData.intakeStatus?.hasPublishedIntakes ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-muted-foreground">
                    No client intake form has been published yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your realtor will publish an intake form when ready.
                  </p>
                </div>
              ) : portalData.pendingIntakes.length === 0 &&
                (portalData.intakeStatus?.completedCount || 0) > 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="text-muted-foreground">
                    Your client intake form has been completed.
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Thank you for providing your information!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portalData.pendingIntakes.map((intake) => (
                    <div
                      key={intake.id}
                      className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-lg">
                              Complete Your Client Information
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Please fill out your client intake form to get
                            started with your transaction.
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Form created:{" "}
                            {new Date(intake.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          onClick={() => navigateToIntake(intake.id)}
                          className="bg-blue-600 hover:bg-blue-700 ml-4"
                        >
                          Complete Form
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDF Documents */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction Documents (
                {(portalData.formsData?.completed?.length || 0) +
                  (portalData.formsData?.inProgress?.length || 0) +
                  (portalData.formsData?.upcoming?.length || 0)}
                )
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categorizingForms && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Categorizing documents...
                </div>
              )}
              {!portalData.formsData?.completed?.length &&
              !portalData.formsData?.inProgress?.length &&
              !portalData.formsData?.upcoming?.length ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-muted-foreground">
                    No transaction documents available yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Documents will appear here as your transaction progresses.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Completed Documents */}
                  {portalData.formsData?.completed?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Completed ({portalData.formsData.completed.length})
                      </h4>
                      <div className="space-y-2">
                        {portalData.formsData.completed.map(
                          (form: FormWithSignatures) => (
                            <div
                              key={form.id}
                              className="border rounded-lg p-3 bg-green-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {form.form_type}
                                  </p>
                                  {form.dealOptions?.address && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {form.dealOptions.address}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Completed:{" "}
                                    {new Date(
                                      form.created_at
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => viewPdf(form, true)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  {form.finalized_pdf && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        downloadPdf(
                                          form.finalized_pdf,
                                          form.form_type
                                        )
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* In Progress Documents */}
                  {portalData.formsData?.inProgress?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-1">
                        <PenTool className="h-4 w-4" />
                        Ready for Action (
                        {portalData.formsData.inProgress.length})
                      </h4>
                      <div className="space-y-2">
                        {portalData.formsData.inProgress.map(
                          (form: FormWithSignatures) => {
                            // Determine if the user's signature is expired
                            let isExpired = false;
                            let signatureCreatedAt: string | undefined =
                              undefined;
                            if (
                              form.userSignature &&
                              form.userSignature.created_at
                            ) {
                              signatureCreatedAt =
                                form.userSignature.created_at;
                              isExpired = signatureCreatedAt
                                ? Date.now() -
                                    new Date(signatureCreatedAt).getTime() >
                                  3 * 24 * 60 * 60 * 1000
                                : false;
                            }
                            return (
                              <div
                                key={form.id}
                                className="border rounded-lg p-3 bg-blue-50"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {formTypeDisplay(form.form_type)}
                                    </p>
                                    {form.dealOptions?.address && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {form.dealOptions.address}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      <span>
                                        Signers:{" "}
                                        {form.signatures
                                          .map((sig: any) => sig.action_email)
                                          .join(", ")}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Created:{" "}
                                      {typeof form.created_at === "string"
                                        ? new Date(
                                            form.created_at
                                          ).toLocaleDateString()
                                        : ""}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {/* Only show action button if not expired */}
                                    {!isExpired ? (
                                      <Button
                                        size="sm"
                                        onClick={() => viewPdf(form, false)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        {form.actionAs === "delegator" ? (
                                          <>
                                            <Users className="h-4 w-4 mr-1" />
                                            Delegate
                                          </>
                                        ) : (
                                          <>
                                            <PenTool className="h-4 w-4 mr-1" />
                                            Sign
                                          </>
                                        )}
                                      </Button>
                                    ) : (
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs text-red-500 font-semibold">
                                          Link expired
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-6">
                                          Please ask your realtor to send the
                                          signature again.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Documents */}
                  {portalData.formsData?.upcoming?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-700 mb-3 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Waiting for Others (
                        {portalData.formsData.upcoming.length})
                      </h4>
                      <div className="space-y-2">
                        {portalData.formsData.upcoming.map(
                          (form: FormWithSignatures) => (
                            <div
                              key={form.id}
                              className="border rounded-lg p-3 bg-orange-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {form.form_type}
                                  </p>
                                  {form.dealOptions?.address && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {form.dealOptions.address}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>
                                      Signers:{" "}
                                      {form.signatures
                                        .map((sig: any) => sig.action_email)
                                        .join(", ")}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Created:{" "}
                                    {typeof form.created_at === "string"
                                      ? new Date(
                                          form.created_at
                                        ).toLocaleDateString()
                                      : ""}
                                  </p>
                                  <p className="text-xs text-orange-600">
                                    Waiting for other signers to complete
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => viewPdf(form, true)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
