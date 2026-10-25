"use server";

import { DealOption, DealOptionFormMerged, Form, PDFFormField } from "@/components/files/types/realtor";
import {
  getAuthToken,
} from "../general";
const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function getDealOptionsWithForms(dealId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/dealOptions/${dealId}/with-forms`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch deal options:", errorData);
    throw new Error(errorData.error || "Failed to fetch deal options");
  }

  const dealOptions = await response.json();
  return dealOptions as DealOptionFormMerged[];
}

export async function createDealOption(dealId: string, address: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/${dealId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create deal option");
  }

  const result = await response.json();
  const dealOption: DealOptionFormMerged = {
    ...result.dealOption,
    forms: result.forms,
  };
  return dealOption as DealOptionFormMerged;
}

export async function updateDealOption(
  dealOptionId: string,
  data: Partial<DealOption>
) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/${dealOptionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update deal option");
  }

  const result = await response.json();
  return result.dealOption;
}

export async function deleteDealOption(dealOptionId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/${dealOptionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete deal option");
  }

  return response.json();
}

export async function addFormToDealOption(
  dealOptionId: string,
  form_type: string,
  stage?: string
) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/dealOptions/addform/${dealOptionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ form_type, form_stage: stage }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add form to deal option");
  }
  const result = await response.json() as unknown as Form; 
  return result;
}

export async function uploadFormToDealOption(
  file: File,
  dealOptionId: string,
  formName: string,
  stage?: string
): Promise<Form> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("formName", formName);
    if (stage) {
      formData.append("form_stage", stage);
    }

    const response = await fetch(
      `${API_BASE_URL}/realtor/dealOptions/uploadform/${dealOptionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    // 4. Handle any non-200 responses the same way as your other helpers.
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "addformtodealoption → server responded with error:",
        errorData,
      );
      throw new Error(
        errorData?.error ?? `Upload failed: ${response.status} ${response.statusText}`,
      );
    }
    const result = (await response.json()) as unknown as Form;
    return result;
  } catch (err) {
    console.error("addformtodealoption → caught error:", err);
    throw err;
  }
}

export async function getDealOption(dealOptionId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/${dealOptionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get deal option");
  }
  
  const result = (await response.json()) as DealOption;
  return result;
} 

export interface TextFieldOverlay {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  color?: {
    r: number;
    g: number;
    b: number;
  };
}

export interface CheckmarkOverlay {
  x: number;
  y: number;
  checked: boolean;
  size?: number;
  color?: { r: number; g: number; b: number };
}

export interface DateFieldOverlay {
  x: number;
  y: number;
  date: string;
  fontSize?: number;
  color?: {
    r: number;
    g: number;
    b: number;
  };
}

export interface SignatureFieldOverlay {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  fieldName: string;
  displayName: string;
  email: string;
  actionAs: string;
  fontSize?: number;
  color?: {
    r: number;
    g: number;
    b: number;
  };
}

export interface PdfOverlayData {
  textFields?: TextFieldOverlay[];
  checkmarks?: CheckmarkOverlay[];
  dateFields?: DateFieldOverlay[];
  signatureFields?: SignatureFieldOverlay[];
  pageNumber?: number;
}

export interface PdfOverlayResponse {
  success: boolean;
  pdfId: string;
  filePath: string;
  message: string;
}

export interface PdfOverlayWithFormResponse extends PdfOverlayResponse {
  formId: string;
}

/**
 * Creates a PDF with overlays without saving form data
 */
export async function createPdfWithOverlays(
  pdfFile: File,
  overlayData: PdfOverlayData
): Promise<PdfOverlayResponse> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("overlayData", JSON.stringify(overlayData));

    const response = await fetch(
      `${API_BASE_URL}/realtor/dealOptions/create-pdf-with-overlays`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("createPdfWithOverlays → server responded with error:", errorData);
      throw new Error(
        errorData?.error ?? `PDF overlay creation failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json() as PdfOverlayResponse;
    return result;
  } catch (err) {
    console.error("createPdfWithOverlays → caught error:", err);
    throw err;
  }
}

/**
 * Creates a PDF with overlays and saves signature field data to a form record
 */
export async function createPdfWithOverlaysAndForm(
  pdfFile: File,
  overlayData: PdfOverlayData,
  formId: string,
  formType?: string
): Promise<PdfOverlayWithFormResponse> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("overlayData", JSON.stringify(overlayData));
    if (formType) {
      formData.append("formType", formType);
    }

    const response = await fetch(
      `${API_BASE_URL}/realtor/dealOptions/create-pdf-with-overlays-and-form/${formId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "createPdfWithOverlaysAndForm → server responded with error:",
        errorData
      );
      throw new Error(
        errorData?.error ?? `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as unknown as PdfOverlayWithFormResponse;
    return result;
  } catch (err) {
    console.error("createPdfWithOverlaysAndForm → caught error:", err);
    throw err;
  }
}

// Property image management functions
export async function uploadPropertyImages(
  files: File[],
  dealOptionId: string
): Promise<{ uploadedImages: string[]; dealOption: DealOption }> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(
      `${API_BASE_URL}/realtor/dealOptions/${dealOptionId}/upload-images`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("uploadPropertyImages → server responded with error:", errorData);
      throw new Error(
        errorData?.error ?? `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return {
      uploadedImages: result.uploadedImages,
      dealOption: result.dealOption,
    };
  } catch (err) {
    console.error("uploadPropertyImages → caught error:", err);
    throw err;
  }
}

export async function deletePropertyImage(
  imagePath: string,
  dealOptionId: string
): Promise<DealOption> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/realtor/dealOptions/${dealOptionId}/images`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePath }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("deletePropertyImage → server responded with error:", errorData);
      throw new Error(
        errorData?.error ?? `Delete failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.dealOption;
  } catch (err) {
    console.error("deletePropertyImage → caught error:", err);
    throw err;
  }
}

export async function getPropertyImageUrls(
  dealOptionId: string
): Promise<{ [path: string]: string }> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/realtor/dealOptions/${dealOptionId}/image-urls`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("getPropertyImageUrls → server responded with error:", errorData);
      throw new Error(
        errorData?.error ?? `Fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.imageUrls;
  } catch (err) {
    console.error("getPropertyImageUrls → caught error:", err);
    throw err;
  }
}

// Save PDF field metadata without generating PDF
export async function savePdfFieldMetadata(
  formId: string,
  fields: PDFFormField[]
): Promise<{ success: boolean; formId: string }> {
  
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/save-pdf-field-metadata/${formId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[FRONTEND-SAVE] Save failed:", errorData);
    throw new Error(errorData.details || errorData.error || "Failed to save PDF field metadata");
  }

  const result = await response.json();
  return result;
}

// Load PDF field metadata
export async function loadPdfFieldMetadata(formId: string): Promise<any[]> {
  
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/load-pdf-field-metadata/${formId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[FRONTEND-LOAD] Load failed:", errorData);
    throw new Error(errorData.details || errorData.error || "Failed to load PDF field metadata");
  }

  const data = await response.json();
  return data.fields;
}

