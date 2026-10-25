"use server";

import { PartyResponse } from "@/components/files/types/realtor";

const API = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

// Removed fetchClientIntakeEmail - no longer needed for OTP flow

// Removed requestClientIntakeOtp - no longer needed for OTP flow

// Removed verifyClientIntakeOtp - no longer needed for OTP flow

/* ───── get client intake without authentication ───── */
export async function getClientIntakeByIdNoAuth(intakeId: string) {
  const response = await fetch(`${API}/jwt/party-intake/${intakeId}`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch client intake");
  }
  return response.json();
}

/* ───── update client intake response without authentication ───── */
export async function updateClientIntakeResponseNoAuth(
  intakeId: string,
  partyResponse: PartyResponse,
  fileUploadResponse: Record<string, File[]>
) {
  
  const formData = new FormData();
  
  // Add party response as JSON string
  formData.append('partyResponse', JSON.stringify(partyResponse));
  
  // Add each file with its field ID
  let totalFilesAdded = 0;
  Object.entries(fileUploadResponse).forEach(([fieldId, files]) => {
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`file_${fieldId}_${index}`, file);
        totalFilesAdded++;
      });
      // Also send the field ID and count for backend processing
      formData.append(`fieldId_${fieldId}`, fieldId);
      formData.append(`fileCount_${fieldId}`, files.length.toString());
    }
  });
  
  
  const response = await fetch(`${API}/jwt/party-intake/${intakeId}/update`, {
    method: "PATCH",
    // Remove Content-Type header to let browser set it with boundary for multipart/form-data
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update client intake response");
  }
  return response.json();
} 