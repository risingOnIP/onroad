"use server";

import { Schema } from "@/components/files/types/realtor";
import {
  getAuthToken,
} from "../general";



const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function addItemToSchema(itemType: 'Question' | 'FormField', dealId: string, order: number, block: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/schema/${dealId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ itemType, order, block }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to add item to schema:", errorData);
    throw new Error(errorData.error || "Failed to add item to schema");
  }

  return response.json();
}

export async function getSchemaByFormType(formType: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/schema/${formType}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch schema:", errorData);
    throw new Error(errorData.error || "Failed to fetch schema");
  }

  return response.json() as unknown as Schema;
}

