"use server";

import { SignatureEvent } from "@/components/files/types/realtor";

export async function submitDelegatedDocument(
  signatureCollectionId: string,
  token: string,
  delegationDataMapping: Record<string, string>,
  signingEvents: SignatureEvent[]
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/submit-delegated-document/${signatureCollectionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          delegationDataMapping,
          signingEvents,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit delegated document");
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error submitting delegated document:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to submit delegated document" 
    };
  }
}