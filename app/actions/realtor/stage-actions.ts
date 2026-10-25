"use server";

import { getAuthToken } from "../general";

interface Stage {
  name: string;
  color: string;
  order: number;
}

export async function getStagesForDeal(dealId: string): Promise<Stage[]> {
  const token = await getAuthToken();
  const baseUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

  const response = await fetch(`${baseUrl}/realtor/deals/${dealId}/stages`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stages");
  }

  return response.json();
}