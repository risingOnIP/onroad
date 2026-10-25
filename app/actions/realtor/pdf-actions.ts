"use server";

import { getAuthToken, API_BASE_URL } from "@/app/actions/general";

export async function uploadGeneratedPDF(
  pdfBlob: Blob,
  formId: string
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    const token = await getAuthToken();
    
    // Create FormData to send as multipart form data
    const formData = new FormData();
    formData.append("pdf", pdfBlob, "generated.pdf");
    formData.append("formId", formId);

    const response = await fetch(
      `${API_BASE_URL}/realtor/pdf/upload-generated`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Don't set Content-Type header - let browser set it with boundary for FormData
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error uploading generated PDF:", errorData);
      return { 
        success: false, 
        error: errorData.error || "Failed to upload generated PDF" 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      pdfUrl: data.pdfUrl 
    };
  } catch (error) {
    console.error("Error in uploadGeneratedPDF:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function checkPDFLockStatus(
  formId: string
): Promise<{ isLocked: boolean; pdfUrl?: string; error?: string }> {
  try {
    
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/realtor/pdf/lock-status/${formId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[LOCK-STATUS-API] API error:", errorData);
      return { isLocked: false, error: errorData.error || "Failed to check lock status" };
    }

    const data = await response.json();
    

    const isLocked = data?.is_pdf_locked || false;

    return {
      isLocked: isLocked,
      pdfUrl: data?.file_upload_pdf
    };
  } catch (error) {
    console.error("[LOCK-STATUS-API] Unexpected error:", error);
    return { isLocked: false, error: "An unexpected error occurred" };
  }
}

export async function unlockPDF(
  formId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/realtor/pdf/unlock/${formId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error unlocking PDF:", errorData);
      return { success: false, error: errorData.error || "Failed to unlock PDF" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in unlockPDF:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

