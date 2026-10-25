"use server";

import { Party } from "@/components/files/types/realtor";
import { API_BASE_URL, getAuthToken } from "../general";

export async function getAllParties() {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/parties/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch parties:", errorData);
    throw new Error(errorData.error || "Failed to fetch parties");
  }

  const parties = (await response.json()) as Party[];
  return parties;
}

export async function getPartyById(partyId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/parties/by-id/${partyId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch party:", errorData);
    throw new Error(errorData.error || "Failed to fetch party");
  }
  const newParty = (await response.json()) as Party;
  return newParty;
}
export async function insertPartyApiCall(partyData: Omit<Party, 'id' | 'realtor_id' | 'created_at'>) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/parties/insert`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({partyData}),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to insert party:", errorData);
    throw new Error(errorData.error || "Failed to insert party");
  }
  const newParty = (await response.json()) as Party;
  return newParty;
}

export async function updatePartyApiCall(updatingParty: Partial<Party>, partyId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/parties/update/${partyId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify({updatingParty}),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to update party:", errorData);
    throw new Error(errorData.error || "Failed to update party");
  }
  const updatedParty = (await response.json()) as Party;
  return updatedParty;
}

