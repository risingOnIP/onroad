"use server";

import { Schema } from "@/components/files/types/realtor";
import { getAuthToken } from "../general";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function getLightningSchema(side: string, dealType: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/lightning/${side}/${dealType}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json() as unknown as Schema;
}