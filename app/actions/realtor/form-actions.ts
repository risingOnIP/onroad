"use server";

import {
  AvailableForms,
  FILE_NAMES,
  FileUpload,
  Form,
  PDFFormField,
  Schema,
  SchemaItem,
  SignatureInput,
  SignatureOutput,
  SignerAssignment,
} from "@/components/files/types/realtor";
import { getAuthToken } from "../general";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Helper function to get the PDF filename for a form type
 */
async function getFormPDFFilename(formType: string): Promise<string> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3200/api';
  
  try {
    const response = await fetch(`${API_BASE_URL}/realtor/blank-files/pdf-filename/${formType}`);
    if (response.ok) {
      const data = await response.json();
      return data.pdfFilename;
    }
  } catch (error) {
    console.error(`Error getting PDF filename for ${formType}:`, error);
  }
  
  // Fallback to default pattern
  return `${formType}_Fillable`;
}
const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function getForm(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/forms/${formId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch form");
  }

  return response.json() as unknown as Form;
}

export async function deleteForm(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/forms/${formId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete form");
  }

  return response.json() as unknown as {
    message: string;
    success: boolean;
    deletedForm: Form;
  };
}

export async function getAvailableFormsFromDealId(dealId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/available/from-deal/${dealId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch available forms");
  }

  return response.json() as unknown as AvailableForms;
}

export async function getAvailableFormsFromTemplate(templateId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/available/from-template-id/${templateId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch available forms");
  }

  return response.json() as unknown as string[];
}

export async function getAvailableFormsFromTemplateId(templateId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/available/from-template-id/${templateId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch available forms");
  }

  return response.json() as unknown as AvailableForms;
}

export async function updateFormResponse(
  formId: string,
  itemKey: string,
  newValue: string | string[] | SignatureInput | FileUpload | SignatureOutput
) {
  const token = await getAuthToken();
  
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/realtor/forms/updateFormResponse/${formId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemKey,
          newValue,
        }),
        signal: controller.signal, // Add abort signal for timeout
      }
    );
    
    clearTimeout(timeoutId);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update form response: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse JSON response
    const result = await response.json();
    
    // Check if the result indicates an error
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error("Request timed out - please check your internet connection");
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
        throw new Error("Network error - please check your internet connection");
      }
    }
    
    throw error;
  }
}

export async function updateFormOrderInDealOption(
  updates: { id: string; order: number; form_stage?: string }[]
) {
  const token = await getAuthToken();

  // Transform the data format to match backend expectations
  const transformedUpdates = updates.map(({ id, order, form_stage }) => ({
    formId: id,
    newOrder: order,
    form_stage,
  }));

  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/update-form-order-in-deal-option/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        updates: transformedUpdates,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update form order in deal option");
  }
}

export async function getSignatureSequence(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/get-signature-sequence/${formId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch signature sequence");
  }

  return response.json() as unknown as SignerAssignment[][];
}

export async function saveSignatureSequence(
  formId: string,
  signatureSequence: SignerAssignment[][]
) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/save-signature-sequence/${formId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signatureSequence,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save signature sequence");
  }

  return response.json() as unknown as SignerAssignment[][];
}

export async function updateFormCustomSchema(
  formId: string,
  customSchema: SchemaItem[],
  pdfFormFields: PDFFormField[]
) {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/update-custom-schema/${formId}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        custom_schema: customSchema,
        pdf_form_fields: pdfFormFields 
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update custom schema: ${response.statusText}`);
  }

  return response.json();
}

export async function updateFormWithCustomPdf(
  formId: string,
  fileName: FILE_NAMES,
  customSchema: Schema,
  filledPdfBlob?: Blob // Add parameter for the filled PDF blob
) {
  const token = await getAuthToken();

  let blob: Blob;
  let filename: string;

  if (filledPdfBlob) {
    // Use the filled PDF blob passed from the conversion process
    blob = filledPdfBlob;
    filename = `${fileName}_Filled.pdf`;
  } else {
    // Fallback: Read the blank file directly from the filesystem (for backwards compatibility)
    const pdfFilename = await getFormPDFFilename(fileName);
    const filePath = join(
      process.cwd(),
      "lib",
      "blank_files",
      `${pdfFilename}.pdf`
    );
    const fileBuffer = await readFile(filePath);
    blob = new Blob([fileBuffer], { type: "application/pdf" });
    filename = `${pdfFilename}.pdf`;
  }

  // Create FormData to send as multipart form data
  const formData = new FormData();
  formData.append("custom_schema", JSON.stringify(customSchema));
  formData.append("file_upload_pdf", blob, filename);

  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/turn-into-custom-form/${formId}`,
    {
      
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Don't set Content-Type header - let browser set it with boundary for FormData
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update form with custom PDF");
  }

  return response.json() as unknown as {
    success: boolean;
    message: string;
    form: Form;
    filePath?: string;
  };
}

export async function removeSignaturesAndEnableEditing(formId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/forms/remove-signatures/${formId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove signatures and re-enable editing");
  }

  return response.json();
}


export async function getAllExistingFormTypes(): Promise<string[]> {
  const token = await getAuthToken();
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/realtor/forms/all-form-types`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch all existing form types");
      return [];
    }

    const data = await response.json();
    return data.formTypes || [];
  } catch (error) {
    console.error("Error fetching all existing form types:", error);
    return [];
  }
}

