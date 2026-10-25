"use client";

import React, { useEffect, useState, useRef } from "react";
import { Document, Page } from "react-pdf";
import { toast } from "sonner";
import { pdfjs } from "react-pdf";
import * as pdfjsLib from "pdfjs-dist/webpack.mjs";
import { PDFDocument } from "pdf-lib";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import {
  fetchSignerEmail,
  getSignatureCollectionNoAuth,
  requestOtp,
  verifyOtp,
  getFormNoAuth,
  getSchemaByFormTypeNoAuth,
  signingSubmitButtonCalled,
  getDownloadUrlNoAuth,
  getBlankFileNoAuth,
} from "@/app/actions/jwt/signing-actions";
import { modifyPDF } from "@/components/files/realtor/pdf-utils/downloadFunction";
import {
  Form,
  FormResponse,
  SchemaItem,
  SignatureCollection,
  SignatureEvent,
  SignatureInput,
} from "@/components/files/types/realtor";

import SignerPad from "./SignerPad";
import {
  Card,
  CardFooter,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useParams } from "next/navigation";
import { X } from "lucide-react";

// Configure pdf.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");
const year = today.getFullYear();
const formattedDate = `${month}/${day}/${year}`;

/** A signer widget (one per display name). */
interface SigningWidget {
  displayName: string;
  unique_id: string;
  fields: {
    formfield_name: string;
    page_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    signaturePng: string; // empty when unsigned
  }[];
}

/** A date field widget */
interface DateFieldWidget {
  unique_id: string;
  linked_field_name: string;
  formfield_name: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isFilled: boolean;
}

const pdfScale = 1.0;

// simple deep-clone helper
function deepClone<T>(obj: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
}

const SignatureCollectionSignerPage = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [signingWidgets, setSigningWidgets] = useState<SigningWidget[]>([]);
  const [dateFieldWidgets, setDateFieldWidgets] = useState<DateFieldWidget[]>(
    []
  );
  const [activeTarget, setActiveTarget] = useState<{
    uniqueId: string;
    formfield_name: string;
  } | null>(null);

  const [step, setStep] = useState<"otp" | "doc" | "consent">("otp");
  const [signerEmail, setSignerEmail] = useState("");
  const [code, setCode] = useState("");
  const [isApplyingSignature, setIsApplyingSignature] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingPartyToken, setIsCheckingPartyToken] = useState(true);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [scrollXPosition, setScrollXPosition] = useState(0);
  const [scrollYPosition, setScrollYPosition] = useState(0);

  const [consent, setConsent] = useState(false);
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false);
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [signatureEvents, setSignatureEvents] = useState<SignatureEvent[]>([]);

  const { signatureCollectionId } = useParams<{
    signatureCollectionId: string;
  }>();

  const [isVerifying, setIsVerifying] = useState(false);

  // Remove separate co-signer states - signatures will be embedded directly in PDF
  // const [coSignerSignatures, setCoSignerSignatures] = useState<Record<string, string>>({});
  // const [coSignerSignatureWidgets, setCoSignerSignatureWidgets] = useState<SigningWidget[]>([]);

  /* -------------------------
     Helpers
   --------------------------*/

  const setPdfUrlSafely = (newUrl: string) => {
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return newUrl;
    });
  };

  const saveScrollPosition = () => {
    if (pdfContainerRef.current) {
      setScrollXPosition(Math.round(pdfContainerRef.current.scrollLeft));
      setScrollYPosition(Math.round(pdfContainerRef.current.scrollTop));
    }
  };

  const restoreScrollPosition = () => {
    if (pdfContainerRef.current && (scrollXPosition || scrollYPosition)) {
      [0, 100, 300].forEach((delay) =>
        setTimeout(() => {
          if (pdfContainerRef.current) {
            pdfContainerRef.current.scrollLeft = scrollXPosition;
            pdfContainerRef.current.scrollTop = scrollYPosition;
          }
        }, delay)
      );
    }
  };

  const scrollToPage = (pageNumber: number) => {
    const el = pageRefs.current[pageNumber - 1];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToField = (formfield_name: string) => {
    
    // Find the field in signingWidgets or dateFieldWidgets
    let targetField: any = null;
    let fieldPageNumber = 0;
    
    // Check signing widgets
    for (const widget of signingWidgets) {
      const field = widget.fields.find(f => f.formfield_name === formfield_name);
      if (field) {
        targetField = field;
        fieldPageNumber = field.page_number;
        break;
      }
    }
    
    // If not found in signing widgets, check date field widgets
    if (!targetField) {
      const dateField = dateFieldWidgets.find(d => d.formfield_name === formfield_name);
      if (dateField) {
        targetField = dateField;
        fieldPageNumber = dateField.page_number;
      }
    }
    
    if (!targetField || !fieldPageNumber) {
      console.warn(`Field ${formfield_name} not found`);
      return;
    }
    
    // Get the page element
    const pageElement = pageRefs.current[fieldPageNumber - 1];
    if (!pageElement) {
      console.warn(`Page element for page ${fieldPageNumber} not found`, pageRefs.current);
      return;
    }
    
    // Find the scrollable container (the div with overflow-y-auto)
    const scrollContainer = document.querySelector('.flex-1.bg-card.rounded-lg.shadow-sm.p-4.flex.justify-center.overflow-y-auto') as HTMLElement;
    if (!scrollContainer) {
      console.warn("Scroll container not found");
      return;
    }
    
    
    // Get positions relative to the scroll container
    const containerRect = scrollContainer.getBoundingClientRect();
    const pageRect = pageElement.getBoundingClientRect();
    
    // Calculate field position relative to the scroll container
    const pageOffsetInContainer = pageRect.top - containerRect.top + scrollContainer.scrollTop;
    const fieldTopInContainer = pageOffsetInContainer + targetField.y;
    const fieldHeight = targetField.height;
    
    
    // Calculate ideal scroll position to center the field in the container
    const containerHeight = scrollContainer.clientHeight;
    const idealScrollPosition = fieldTopInContainer - (containerHeight / 2) + (fieldHeight / 2);
    
    // Get container's max scroll
    const maxScrollY = scrollContainer.scrollHeight - containerHeight;
    
    // Clamp the scroll position to valid boundaries
    const targetScrollPosition = Math.max(0, Math.min(idealScrollPosition, maxScrollY));
    
    
    // Scroll the container to the calculated position
    scrollContainer.scrollTo({
      top: targetScrollPosition,
      behavior: 'smooth'
    });
  };

  /* -------------------------
     Data loading
   --------------------------*/

  // Initial authentication check
  useEffect(() => {
    const checkAuthentication = async () => {
      /* -- Check for party portal token first -- */
      try {
        const partyToken = localStorage.getItem("partyPortalToken");
        if (partyToken) {

          // Try to verify the party portal token for signature access
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/${signatureCollectionId}/verify-party-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: partyToken }),
            }
          );

          if (response.ok) {
            const { token: signatureToken, email } = await response.json();
            setToken(signatureToken);
            setSignerEmail(email);
            setIsCheckingPartyToken(false);
            setStep("consent");
            return; // Skip OTP flow
          } else {
            localStorage.removeItem("partyPortalToken"); // Remove invalid token
          }
        }
      } catch (err) {
        console.error("Error verifying party portal token:", err);
      }

      setIsCheckingPartyToken(false);

      /* -- Fallback: OTP & email -- */
      try {
        const { email } = await fetchSignerEmail(signatureCollectionId);
        setSignerEmail(email);
        await requestOtp(signatureCollectionId);
      } catch (err) {
        if (err instanceof Error && err.message.includes("expired")) {
          toast.error(
            "Signature link expired, please ask for another link or ask for renewal."
          );
        } else {
          console.error(err);
          toast.error("Failed to load signing information");
        }
      }
    };

    checkAuthentication();
  }, [signatureCollectionId]);

  // Load PDF and signature widgets only when we have a valid token
  useEffect(() => {
    if (!token) return; // Don't run if we don't have a token yet

    const loadSignatureDocument = async () => {
      try {
        const sigCollection = await getSignatureCollectionNoAuth(
          signatureCollectionId,
          token
        );

        // Check if current signer has already submitted
        if (
          sigCollection.signature_data &&
          Object.keys(sigCollection.signature_data).length > 0
        ) {
          // Check if any of the signature data belongs to the current signer
          const hasSignedAlready = Object.values(
            sigCollection.signature_data
          ).some((value: any) => value && value.length > 0);
          if (hasSignedAlready) {
            setSubmitted(true);
          }
        }

        // Check if this is a custom form by looking for custom_schema
        const isCustom = sigCollection.custom_schema ? true : false;
        

        // Use custom_schema for custom forms, otherwise fetch schema by form type
        let schema;
        if (isCustom) {
          schema = sigCollection.custom_schema;
        } else {
          schema = await getSchemaByFormTypeNoAuth(
            sigCollection.form_type,
            token
          );
        }

        // Collect signatures from other signers in the same step
        let combinedSignatureData = { ...sigCollection.signature_data };

        if (sigCollection.signature_sequence) {

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/get-all-signatures/${sigCollection.form_id}/${signatureCollectionId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const { signatures } = await response.json();
              // setCoSignerSignatures(signatures); // This state is removed
              combinedSignatureData = {
                ...combinedSignatureData,
                ...signatures,
              };
            } else {
              console.error(
                "Failed to fetch same-step signatures:",
                await response.text()
              );
            }
          } catch (err) {
            console.error("Error fetching same-step signatures:", err);
            // Continue without same-step signatures
          }

        }

        // Add today's date to form_response for linked date fields of current signer's signatures
        const enhancedFormResponse = { ...sigCollection.form_response };

        // Find all linked date fields for signatures that belong to the current signer
        schema.forEach((item) => {
          if (item.display_attributes.input_type === "signature") {
            const sigInput = sigCollection.form_response[
              item.unique_id
            ] as SignatureInput;
            // Only process if this signature belongs to the current signer
            if (sigInput?.email === sigCollection.action_email) {
              if (item.pdf_attributes) {
                item.pdf_attributes.forEach((attr) => {
                  if (attr.linked_dates) {
                    attr.linked_dates.forEach((linkedDate) => {
                      const dateFieldName = linkedDate.dateFieldName;
                      // Only add if not already filled
                      if (
                        !enhancedFormResponse[dateFieldName] ||
                        enhancedFormResponse[dateFieldName] === ""
                      ) {
                        enhancedFormResponse[dateFieldName] = formattedDate;
                      }
                    });
                  }
                });
              }
            }
          }
        });



        const filledBytes = await addDynamicFields(
          sigCollection.form_type,
          schema,
          enhancedFormResponse,
          combinedSignatureData,
          isCustom,
          sigCollection.file_upload_pdf,
          token
        );

        await computeSigningWidgets(
          filledBytes.slice(),
          schema,
          sigCollection.action_email,
          sigCollection
        );

        const blob = new Blob([filledBytes], { type: "application/pdf" });
        setPdfUrlSafely(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Error loading signature document:", err);
        toast.error("Failed to load document");
      }
    };

    loadSignatureDocument();
  }, [signatureCollectionId, token]);

  /** Inject resolved/manual text then return bytes */
  async function addDynamicFields(
    formType: string,
    formSchema: SchemaItem[],
    formResponse: FormResponse,
    signatureData: Record<string, Record<string, string>>,
    isCustomForm: boolean,
    fileUploadPdf: string,
    authToken: string
  ) {
    let base: ArrayBuffer | undefined;

    if (isCustomForm) {
    } else {
    }


    if (isCustomForm) {
      // For custom forms, use the file_upload_pdf field directly
      if (fileUploadPdf) {
        try {
          const downloadUrl = await getDownloadUrlNoAuth(
            fileUploadPdf,
            authToken
          );
          base = await fetch(downloadUrl).then((r) => r.arrayBuffer());
        } catch (error) {
          console.error("Error fetching custom PDF:", error);
        }
      } else {
        // Fallback to blank template if file_upload_pdf is not found
        const blankFile = await getBlankFileNoAuth(formType, authToken, signatureCollectionId);
        if (blankFile.data) {
          base = blankFile.data;
        } else {
          throw new Error("Failed to load blank file");
        }
      }
    } else {
      // For normal forms, use the blank template
      const blankFile = await getBlankFileNoAuth(formType, authToken, signatureCollectionId);
      if (blankFile.data) {
        base = blankFile.data;
      } else {
        throw new Error("Failed to load blank file");
      }
    }

    if (!base) {
      throw new Error("Failed to resolve base PDF bytes");
    }

    const pdfDoc = await PDFDocument.load(base);
    // Don't set submitted based on signatureData - this will be handled elsewhere
    const pdfWithFields = await modifyPDF(
      pdfDoc,
      formSchema,
      formResponse,
      signatureData
    );
    return new Uint8Array(await pdfWithFields.save());
  }

  /** Build widgets */
  async function computeSigningWidgets(
    pdfBytes: Uint8Array,
    schema: SchemaItem[],
    actionEmail: string,
    sigCollection: SignatureCollection
  ) {

    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;

    const widgets: SigningWidget[] = [];
    const dateWidgets: DateFieldWidget[] = [];
    const fieldMap: Record<string, { widgetIdx: number; fieldIdx: number }> =
      {};
    const dateFieldMap: Record<string, number> = {};

    /* pass 1: schema → widgets */
    for (const item of schema) {

      if (item.display_attributes.input_type !== "signature") {
        continue;
      }

      const sigInput = sigCollection.form_response[
        item.unique_id
      ] as SignatureInput;

      if (sigInput?.email !== actionEmail) {
        continue;
      }

      const formFields =
        item.pdf_attributes?.map((attr) => attr.formfield) ?? [];

      if (!formFields.length) {
        continue;
      }

      const widgetIdx = widgets.length; // grab index BEFORE push

      const fields = formFields.map((formfield_name, fieldIdx) => {
        fieldMap[formfield_name as string] = { widgetIdx, fieldIdx };

        // Check if current signer has already signed this field
        // signature_data is structured as: signature_data[unique_id][formfield_name] = signaturePng
        const existingSignature =
          sigCollection.signature_data?.[item.unique_id]?.[
            formfield_name as string
          ] || "";

        return {
          formfield_name: formfield_name as string,
          page_number: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          signaturePng: existingSignature,
        };
      });

      const newWidget = {
        displayName: item.display_attributes.display_name ?? "",
        unique_id: item.unique_id,
        fields,
      };

      widgets.push(newWidget);

      // Check for linked date fields in pdf_attributes
      item.pdf_attributes?.forEach((attr) => {
        if (attr.linked_dates) {
          attr.linked_dates.forEach((linkedDate) => {
            const dateFieldName = linkedDate.dateFieldName;

            // Check if this date field is filled in form_response
            const isFilled =
              !!sigCollection.form_response[dateFieldName] &&
              sigCollection.form_response[dateFieldName] !== "";


            // Try to find the corresponding PDF form field for this date
            // First try with the exact field name from schema
            const possibleFormFields = [
              dateFieldName,
              attr.formfield + "_date",
              (attr.formfield as string).replace(/_signature$/, "_date"),
              dateFieldName.replace(/_/g, ""),
            ];

            possibleFormFields.forEach((possibleField) => {
              if (!dateFieldMap.hasOwnProperty(possibleField)) {
                const dateWidgetIdx = dateWidgets.length;
                dateFieldMap[possibleField] = dateWidgetIdx;

                dateWidgets.push({
                  unique_id: item.unique_id,
                  linked_field_name: dateFieldName,
                  formfield_name: possibleField,
                  page_number: 0,
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  isFilled: isFilled,
                });

              }
            });
          });
        }
      });
    }


    /* pass 2: locate each field on the rendered pages */
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: pdfScale });
      for (const annot of await page.getAnnotations()) {
        if (annot.subtype !== "Widget" || !annot.fieldName) continue;

        // Check if it's a signature field
        const map = fieldMap[annot.fieldName];
        if (map) {
          const [l, t, r, b] = vp.convertToViewportRectangle(annot.rect!);
          const f = widgets[map.widgetIdx].fields[map.fieldIdx];
          f.page_number = p;
          f.x = Math.min(l, r);
          f.y = Math.min(t, b);
          f.width = Math.abs(r - l);
          f.height = Math.abs(b - t);
          continue;
        }

        // Check if it's a date field
        const dateIdx = dateFieldMap[annot.fieldName];
        if (dateIdx !== undefined) {
          const [l, t, r, b] = vp.convertToViewportRectangle(annot.rect!);
          const dateField = dateWidgets[dateIdx];
          dateField.page_number = p;
          dateField.x = Math.min(l, r);
          dateField.y = Math.min(t, b);
          dateField.width = Math.abs(r - l);
          dateField.height = Math.abs(b - t);
        }
      }
    }

    await pdf.destroy();
    setSigningWidgets(widgets);
    setDateFieldWidgets(dateWidgets);
    setNumPages(pdf.numPages);
  }

  /* -------------------------
     OTP + Consent
   --------------------------*/

  async function handleVerify() {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await verifyOtp(signatureCollectionId, signerEmail, code);
      setToken(res.token);
      setStep("consent");
    } catch (err: any) {
      toast.error(
        err?.message === "Bad code" ? "Invalid OTP" : "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  }

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

  const eConsentClicked = () => {
    if (!consent) {
      toast.error("Please consent to continue");
      return;
    }
    setSignatureEvents((ev) => [
      ...ev,
      {
        event: "esign_consent_given",
        sequence: ev.length ? ev[ev.length - 1].sequence + 1 : 1,
        timestamp: new Date(Date.now()),
        ip_address: "",
        user_agent: "",
        actor_uuid: "",
        actor_auth_method: "email_otp",
        signer_email: signerEmail,
      },
    ]);
    setStep("doc");
  };

  /* -------------------------
     Signing logic
   --------------------------*/

  const onApplySignatureClicked = async (sigDataUrl: string) => {
    if (!pdfUrl || !activeTarget) return toast.error("No active field");

    setIsApplyingSignature(true);
    try {
      saveScrollPosition();

      // embed image into PDF
      const bytes = await fetch(pdfUrl).then((r) => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes);
      const pdfForm = pdfDoc.getForm();

      const { uniqueId, formfield_name } = activeTarget;
      const widgetSigned = signingWidgets.find((w) => w.unique_id === uniqueId);
      const target = widgetSigned?.fields.find(
        (f) => f.formfield_name === formfield_name
      );

      if (!widgetSigned || !target) {
        toast.error("No active field");
        throw new Error("PDF Field not found");
      }

      const sigField = pdfForm.getTextField(target.formfield_name);
      if (sigField) {
        sigField.setImage(await pdfDoc.embedPng(sigDataUrl));

        // update React state
        setSigningWidgets((prev) => {
          const copy = deepClone(prev);
          const widgetIdx = copy.findIndex(
            (w) => w.unique_id === widgetSigned.unique_id
          );
          const fieldIdx = copy[widgetIdx].fields.findIndex(
            (f) => f.formfield_name === target.formfield_name
          );
          copy[widgetIdx].fields[fieldIdx].signaturePng = sigDataUrl;
          return copy;
        });
      }

      setSignatureEvents((ev) => [
        ...ev,
        {
          event: "signature_applied",
          sequence: ev.length ? ev[ev.length - 1].sequence + 1 : 1,
          timestamp: new Date(Date.now()),
          ip_address: "",
          user_agent: "",
          actor_uuid: "",
          actor_auth_method: "email_otp",
          field_signed: {
            unique_id: widgetSigned.unique_id,
            field_name: target.formfield_name,
            field_value: sigDataUrl,
            signature_method: "draw",
          },
          signer_email: signerEmail,
        },
      ]);

      //do not flatten the pdf
      const newPdfBytes = await pdfDoc.save();

      // Create a new blob and URL
      const blob = new Blob([newPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      //update the pdf url
      setPdfUrl(null);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setPdfUrlSafely(url);
      setActiveTarget(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply signature");
    } finally {
      setIsApplyingSignature(false);
    }
  };

  const allSigned = signingWidgets.every((w) =>
    w.fields.every((f) => f.signaturePng)
  );

  /* -------------------------
     Render
   --------------------------*/

  return (
    <>
      {/* LOADING STATE - Checking for party portal token */}
      {isCheckingPartyToken && (
        <div className="min-h-screen flex items-center justify-center bg-muted p-6">
          <Card className="w-[22rem] shadow">
            <CardContent className="space-y-4 flex flex-col items-center pt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-center text-sm text-muted-foreground">
                Checking authentication...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OTP STEP */}
      {step === "otp" && !isCheckingPartyToken && (
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
      )}

      {/* CONSENT STEP */}
      {step === "consent" && (
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
                onClick={eConsentClicked}
                disabled={!consent}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                Continue to Document
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* DOCUMENT STEP */}
      {step === "doc" && (
        <div className="min-h-screen bg-muted p-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Document Signing
              </h2>
              <div className="flex gap-6 h-[calc(100vh-12rem)]">
                {/* SIDEBAR */}
                {signingWidgets.length > 0 && (
                  <div className="w-80 flex-shrink-0 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Signature Fields
                    </h3>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                      {/*
                        Flatten out all fields across all widgets,
                        rendering one card per field, sorted by page number.
                      */}
                      {signingWidgets
                        .flatMap((w) =>
                          w.fields.map((f) => ({
                            ...f,
                            displayName: w.displayName,
                            unique_id: w.unique_id,
                          }))
                        )
                        .sort((a, b) => a.page_number - b.page_number)
                        .map((f) => (
                          <div
                            key={`${f.unique_id}-${f.formfield_name}`}
                            // onClick={() => scrollToPage(f.page_number)}
                            onClick={() => scrollToField(f.formfield_name)}
                            className={`p-4 rounded-lg border cursor-pointer ${
                              f.signaturePng
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-gray-200 hover:border-blue-300 transition-colors"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {f.displayName}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  f.signaturePng
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {f.signaturePng ? "Signed" : "Pending"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Page {f.page_number}</p>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <Button
                      disabled={submitted || !allSigned || submitButtonLoading}
                      onClick={async () => {

                        if (!allSigned) {
                          toast.error("Please sign all required fields");
                          return;
                        }

                        // Store original state for potential rollback
                        const originalSignatureEvents = [...signatureEvents];
                        const originalSubmitted = submitted;
                        let submissionSucceeded = false;

                        try {
                          setSubmitButtonLoading(true);

                          const sigMap = signingWidgets.reduce((acc, w) => {

                            // Get all signed fields for this widget
                            const signedFields = w.fields.filter(
                              (f) => f.signaturePng
                            );

                            if (signedFields.length > 0) {
                              // Create nested mapping: unique_id -> { formfield_name -> signaturePng }
                              acc[w.unique_id] = {};
                              signedFields.forEach((field) => {
                                acc[w.unique_id][field.formfield_name] =
                                  field.signaturePng;
                              });
                            }
                            return acc;
                          }, {} as Record<string, Record<string, string>>);


                          if (!submitted) {
                            const ev: SignatureEvent = {
                              event: "document_submitted",
                              sequence: signatureEvents.length
                                ? signatureEvents[signatureEvents.length - 1]
                                    .sequence + 1
                                : 1,
                              timestamp: new Date(Date.now()),
                              ip_address: "",
                              user_agent: "",
                              actor_uuid: "",
                              actor_auth_method: "email_otp",
                              signer_email: signerEmail,
                            };

                            const allEvents = [...signatureEvents, ev];

                            // Optimistic update - add the submission event
                            setSignatureEvents(allEvents);


                            const submitStartTime = Date.now();

                            try {
                              const result = await signingSubmitButtonCalled(
                                signatureCollectionId,
                                token,
                                allEvents,
                                sigMap,
                                formattedDate
                              );
                              

                              const submitEndTime = Date.now();
                              const submitDuration =
                                submitEndTime - submitStartTime;

                            } catch (submitError) {
                              console.error("Error in signingSubmitButtonCalled:", submitError);
                              console.error("Error stack:", (submitError as Error).stack);
                              throw submitError;
                            }

                            // Mark submission as successful
                            submissionSucceeded = true;

                            // Only set submitted to true after successful API call
                            setSubmitted(true);
                          } else {
                          }
                        } catch (err) {
                          console.error("SUBMISSION ERROR:", err);
                          console.error("Error details:", {
                            message: (err as any)?.message,
                            stack: (err as any)?.stack,
                            name: (err as any)?.name,
                          });

                          // Revert optimistic updates on error
                          setSignatureEvents(originalSignatureEvents);
                          setSubmitted(originalSubmitted);

                          toast.error("Failed to submit signatures");
                        } finally {

                          // Only show success toast if we actually succeeded
                          if (submissionSucceeded) {
                            toast.success("Signatures submitted");
                          }

                          setSubmitButtonLoading(false);
                        }
                      }}
                      className={`w-full mt-6 py-2 px-4 rounded-lg transition-colors ${
                        submitted
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                      }`}
                    >
                      {submitButtonLoading
                        ? "Submitting..."
                        : submitted
                        ? "Document Submitted"
                        : "Submit Document"}
                    </Button>
                  </div>
                )}

                {/* PDF VIEWER */}
                {pdfUrl && (
                  <div
                    ref={pdfContainerRef}
                    className="flex-1 bg-card rounded-lg shadow-sm p-4 flex justify-center overflow-y-auto"
                  >
                    <Document
                      key={pdfUrl}
                      file={pdfUrl}
                      onLoadError={(e: any) => {
                        if (e.message.includes("worker is being destroyed")) {
                          const tmp = pdfUrl;
                          setTimeout(() => setPdfUrl(null), 0);
                          setTimeout(() => setPdfUrl(tmp), 50);
                        }
                        console.error(e);
                        toast.error("Could not load PDF preview");
                      }}
                      onLoadSuccess={({ numPages }) => {
                        setNumPages(numPages);
                        requestAnimationFrame(restoreScrollPosition);
                      }}
                      loading={
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      }
                      className="flex flex-col items-center"
                    >
                      {Array.from({ length: numPages }, (_, i) => (
                        <div
                          key={i}
                          ref={(el) => {
                            pageRefs.current[i] = el;
                          }}
                          className="relative inline-block mx-auto mb-8"
                        >
                          <Page
                            pageNumber={i + 1}
                            scale={pdfScale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="shadow-lg"
                          />

                          {/* UNSIGNED FIELDS */}
                          {signingWidgets.flatMap((w, widgetIdx) =>
                            w.fields
                              .filter(
                                (f) =>
                                  f.page_number === i + 1 &&
                                  !f.signaturePng &&
                                  !submitted
                              )
                              .map((f, fieldIdx) => (
                                <button
                                  key={`${f.formfield_name}-unsigned`}
                                  onClick={() =>
                                    setActiveTarget({
                                      uniqueId: w.unique_id,
                                      formfield_name: f.formfield_name,
                                    })
                                  }
                                  className="absolute cursor-pointer transition-all duration-200 hover:bg-info/10"
                                  style={{
                                    left: f.x * (1 / pdfScale),
                                    top: f.y * (1 / pdfScale),
                                    width: f.width * (1 / pdfScale),
                                    height: f.height * (1 / pdfScale),
                                    background: "#EFF6FF",
                                    border: "2px dashed #3b82f6",
                                    zIndex: 10,
                                  }}
                                ></button>
                              ))
                          )}

                          {/* SIGNED (editable) */}
                          {signingWidgets.flatMap((w, widgetIdx) =>
                            w.fields
                              .filter(
                                (f) =>
                                  f.page_number === i + 1 &&
                                  f.signaturePng &&
                                  !submitted
                              )
                              .map((f) => (
                                <div
                                  key={`${f.formfield_name}-signed`}
                                  className="absolute"
                                  style={{
                                    left: f.x * (1 / pdfScale),
                                    top: f.y * (1 / pdfScale),
                                    width: f.width * (1 / pdfScale),
                                    height: f.height * (1 / pdfScale),
                                    zIndex: 10,
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setSigningWidgets((prev) => {
                                        const copy = deepClone(prev);
                                        const widgetIdx = copy.findIndex(
                                          (widget) =>
                                            widget.unique_id === w.unique_id
                                        );
                                        const fieldIdx = copy[
                                          widgetIdx
                                        ].fields.findIndex(
                                          (field) =>
                                            field.formfield_name ===
                                            f.formfield_name
                                        );
                                        copy[widgetIdx].fields[
                                          fieldIdx
                                        ].signaturePng = "";
                                        return copy;
                                      });
                                    }}
                                    // Removed the small red circle style; now a plain "×" in red
                                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-destructive text-lg cursor-pointer"
                                    style={{ zIndex: 11 }}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                          )}

                          {/* DATE FIELD INDICATORS */}
                          {/* OLD OVERLAY WITH DATE TEXT - COMMENTED OUT
                          {dateFieldWidgets
                            .filter(
                              (d) => d.page_number === i + 1 && !d.isFilled && !submitted
                            )
                            .map((d) => {
                              
                              return (
                                <div
                                  key={`${d.formfield_name}-date`}
                                  className="absolute pointer-events-none flex items-center justify-center"
                                  style={{
                                    left: d.x * (1 / pdfScale),
                                    top: d.y * (1 / pdfScale),
                                    width: d.width * (1 / pdfScale),
                                    height: d.height * (1 / pdfScale),
                                    background: "rgba(251, 191, 36, 0.15)", // Yellow color (amber-400 with opacity)
                                    border: "2px solid #fbbf24", // Yellow border (amber-400)
                                    zIndex: 9,
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#92400e", // Dark amber for text
                                  }}
                                >
                                  {formattedDate}
                                </div>
                              );
                            })}
                          */}
                          {/* NEW GOLDEN BOX OVERLAY WITHOUT DATE TEXT */}
                          {dateFieldWidgets
                            .filter(
                              (d) =>
                                d.page_number === i + 1 &&
                                !d.isFilled &&
                                !submitted
                            )
                            .map((d) => {
                              return (
                                <div
                                  key={`${d.formfield_name}-date`}
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: d.x * (1 / pdfScale),
                                    top: d.y * (1 / pdfScale),
                                    width: d.width * (1 / pdfScale),
                                    height: d.height * (1 / pdfScale),
                                    background: "rgba(251, 191, 36, 0.15)", // Yellow color (amber-400 with opacity)
                                    border: "2px solid #fbbf24", // Yellow border (amber-400)
                                    zIndex: 9,
                                  }}
                                />
                              );
                            })}

                          {/* CO-SIGNER SIGNATURES (read-only) */}
                          {/* This section is removed as co-signer signatures are now embedded directly */}
                        </div>
                      ))}
                    </Document>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGNER PAD */}
      <SignerPad
        isOpen={activeTarget !== null}
        onOpenChange={() => setActiveTarget(null)}
        onApplySignatureClicked={onApplySignatureClicked}
        isApplyingSignature={isApplyingSignature}
        options={[...new Set(signingWidgets.find((sw) => sw.unique_id === activeTarget?.uniqueId)?.fields?.map((f) => f.signaturePng).filter((sig) => sig && sig !== "") || [])]}
      />
    </>
  );
};

export default SignatureCollectionSignerPage;
