'use server'

import { Schema } from "@/components/files/types/realtor";
import { getAuthToken } from "../general";


const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function fetchRealtorIntakeSchema(dealId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${dealId}/client-form`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get client intake schema:", errorData);
    throw new Error(errorData.error || "Failed to get client intake schema");
  }

  const returning = await response.json() as unknown as Schema; 
  return returning; 
}

export async function fetchClientIntakeFormResponses(dealId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${dealId}/client-form-response`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get client intake form responses:", errorData);
    throw new Error(errorData.error || "Failed to get client intake form responses");
  }

  const returning = await response.json() as unknown as Record<string, string>; 
  return returning; 
}

export async function updateClientIntakeForm(dealId: string, itemKey: string, newValue: string) {
  const token = await getAuthToken(); 
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${dealId}/client-form-response`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ itemKey, newValue }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to update client intake form:", errorData);
      throw new Error(errorData.error || "Failed to update client intake form");
    }
}
