'use server'

import { getAuthToken } from "../general";

import { SignatureCollection, SignerAssignment } from "@/components/files/types/realtor";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;


export async function generateSignatureCollection(solicitSignature: Omit<SignatureCollection, "id" | "created_at" | "sender_id" | "signature_data">) {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/solicit-signature/`, {
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify({solicitSignature})
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create signature link:", errorData);
        throw new Error(errorData.error || "failed to create signature link");
    }
    
    return response.json() as unknown as SignatureCollection; 
}

export async function removeSignatureCollection(signatureId: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/remove-signature-collection/${signatureId}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to remove signature collection:", errorData);
        throw new Error(errorData.error || "failed to remove signature collection");
    }

}

export async function getSignatureCollection(signatureId: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/get-signature-collection/${signatureId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get signature collection:", errorData);
        throw new Error(errorData.error || "failed to get signature collection");
    }

    const data: SignatureCollection = await response.json();
    return data;
}

export async function generateSignedPDFURL(pdfURL: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/generate-signed-pdf-url/${pdfURL}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to generate signed URL:", errorData);
        throw new Error(errorData.error || "failed to generate signed URL");
    }

    const signedPdfUrl = await response.json();
    return signedPdfUrl.signedPdfUrl;
}

// Send signature collection email
export interface SendSignatureEmailParams {
    signatureCollectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    formIds?: string[];
    dealId?: string;
}


// Get all forms with signature information for a deal
export async function getDealFormsWithSignatures(dealId: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/deal/${dealId}/forms-with-signatures`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get forms with signatures:", errorData);
        throw new Error(errorData.error || errorData.details || "Failed to get forms with signatures");
    }

    return response.json();
}


export async function updateSignatureCollections(
    formsData: Array<{
        formId: string;
        formName: string;
        signatureSequence: SignerAssignment[][];
    }>,
    dealId: string
) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/update-signature-collections`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ formsData, dealId })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update signature collections:", errorData);
        throw new Error(errorData.error || "failed to update signature collections");
    }

    return response.json() as unknown as {
        success: boolean,
        affectedClients: { email: string; name: string; clientId: string }[],
        removedCount: number,
        addedCount: number,
        formCount: number
    };
}

// Note: sendSignatureUpdateEmail has been removed
// All functionality is now handled in updateSignatureCollections

export async function renewSignatureCollection(signatureCollectionId: string) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/realtor/signatures/renew-signature-collection/${signatureCollectionId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to renew signature collection:", errorData);
        throw new Error(errorData.error || "failed to renew signature collection");
    }
}