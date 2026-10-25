"use server";

import {
  Form,
  SchemaItem,
  SignatureCollection,
  SignatureEvent,
} from "@/components/files/types/realtor";

const API = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

/* ───── meta (email) ───── */
export async function fetchSignerEmail(collectionId: string) {
  const response = await fetch(`${API}/jwt/signing/${collectionId}/email`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Link expired or invalid");
  }
  return response.json() as Promise<{ email: string }>;
}

/* ───── send code ───── */
export async function requestOtp(collectionId: string) {
  const response = await fetch(
    `${API}/jwt/signing/${collectionId}/otp/request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to request OTP");
  }
  return response.json();
}

/* ───── verify code → token ───── */
export async function verifyOtp(
  collectionId: string,
  email: string,
  code: string
) {
  const response = await fetch(
    `${API}/jwt/signing/${collectionId}/otp/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId, email, code }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Bad code");
  }
  return response.json() as Promise<{ token: string }>;
}

/* ───── existing helpers you had ───── */
export async function getFormNoAuth(formId: string, token: string): Promise<Form> {
  const response = await fetch(`${API}/jwt/signing/form/${formId}`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch form");
  }
  return response.json() as Promise<Form>;
}

export async function getSignatureCollectionNoAuth(
  id: string,
  token: string
): Promise<SignatureCollection> {
  const response = await fetch(
    `${API}/jwt/signing/get-signature-collection/${id}`,
    {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get signature collection");
  }
  return response.json() as Promise<SignatureCollection>;
}

export async function getBlankFileNoAuth(formType: string, token: string, signatureCollectionId: string): Promise<{ data: ArrayBuffer | null; error?: { type: string; message: string } }> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3200/api';
    const pdfUrl = `${API_BASE_URL}/jwt/blank-files/${formType}/${signatureCollectionId}`;
    
    
    const response = await fetch(pdfUrl, { 
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Check if it's a TAR form error
      try {
        const errorData = await response.json();
        if (errorData.errorType === 'TAR_FORM_NOT_UPLOADED') {
          return {
            data: null,
            error: {
              type: 'TAR_FORM_NOT_UPLOADED',
              message: errorData.error
            }
          };
        } else if (errorData.errorType === 'NO_BROKER_TETHER') {
          return {
            data: null,
            error: {
              type: 'NO_BROKER_TETHER',
              message: errorData.error
            }
          };
        }
      } catch (e) {
        // Not JSON response, continue with generic error
      }
      
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    // Return as ArrayBuffer
    return { data: await response.arrayBuffer() };
  } catch (error) {
    console.error(`Error loading PDF for form type ${formType}:`, error);
    return {
      data: null,
      error: {
        type: 'GENERIC',
        message: error instanceof Error ? error.message : 'Failed to load PDF'
      }
    };
  }
}

export async function getSchemaByFormTypeNoAuth(
  formType: string,
  token: string
): Promise<SchemaItem[]> {
  const response = await fetch(
    `${API}/jwt/signing/get-schema-by-form-type/${formType}`,
    {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch schema");
  }
  return response.json() as Promise<SchemaItem[]>;
}


export async function addSignatureEvents(
  signatureCollectionId: string,
  token: string,
  signatureEvents: SignatureEvent[]
) {

  const response = await fetch(
    `${API}/jwt/signing/add-signature-events/${signatureCollectionId}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ signatureEvents }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add signature events");
  }

  return response.json() as Promise<SignatureCollection>;
}

export async function getDownloadUrlNoAuth(fileName: string, token: string): Promise<string> {
  const response = await fetch(`${API}/jwt/signing/file-download-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get download URL");
  }
  
  const { url } = await response.json();
  return url;
}

export async function signingSubmitButtonCalled(
  signatureCollectionId: string,
  token: string,
  signingEvents: SignatureEvent[],
  signatureDataMapping: Record<string, Record<string, string>>,
  currentDate: string
) {


const requestUrl = `${API}/jwt/signing/submit-signed-document/${signatureCollectionId}`;



const requestBody = { signatureDataMapping, signingEvents, currentDate};

const requestStartTime = Date.now();

const response = await fetch (
  requestUrl,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  }
);

const requestEndTime = Date.now();
const requestDuration = requestEndTime - requestStartTime;


if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || "Failed to submit signed document");
}

const responseParseStartTime = Date.now();
let responseData;
try {
  responseData = await response.json();
} catch (parseError) {
  console.error("Failed to parse response JSON:", parseError);
  console.error("Response status was:", response.status);
  throw new Error("Failed to parse server response");
}
const responseParseEndTime = Date.now();
const responseParseDuration = responseParseEndTime - responseParseStartTime;


return responseData as SignatureCollection;

}