"use server";

import { ClientIntake, PartyIntakeSchemaItem } from "@/components/files/types/realtor";
import { getAuthToken } from "../general";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function getClientIntakesByDealId(dealId: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/party-intakes/all/${dealId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get client intake schema:", errorData);
    throw new Error(errorData.error || "Failed to get client intake schema");
  }

  const returning =
    (await response.json()) as unknown as ClientIntake[];
  return returning;
}

export async function getClientIntakeById(clientintakeid: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/realtor/party-intakes/id/${clientintakeid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get client intake schema:", errorData);
    throw new Error(errorData.error || "Failed to get client intake schema");
  }

  const returning = (await response.json()) as unknown as ClientIntake;
  return returning;
}

export async function saveClientIntakeSchema(toSaveSchema: PartyIntakeSchemaItem[], clientintakeid: string) {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/realtor/party-intakes/save/${clientintakeid}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ toSaveSchema })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create deal')
  }

  const returning = (await response.json()) as unknown as ClientIntake;
  return returning;

}
//pushing


export async function generateClientIntakeLink(clientIntakeId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/party-intakes/enable-link/${clientIntakeId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();  
    console.error("Failed to generate client intake link:", errorData);
    throw new Error(errorData.error || "Failed to generate client intake link");
  }

  const returning = (await response.json()) as unknown as ClientIntake;
  return returning;
}

export async function revokeClientIntakeLink(clientIntakeId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/party-intakes/disable-link/${clientIntakeId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();  
    console.error("Failed to generate client intake link:", errorData);
    throw new Error(errorData.error || "Failed to generate client intake link");
  }

  const returning = (await response.json()) as unknown as ClientIntake;
  return returning;
}

export async function getSignedClientIntakeFileUploadUrls(filepaths: string[]) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/party-intakes/uploaded-file-urls/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({ filepaths })
    
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get signed client intake file upload URL:", errorData);
    throw new Error(errorData.error || "Failed to get signed client intake file upload URL"); 
  }

  const returning = (await response.json()) as unknown as string[];
  return returning;
}

export async function pushPartyIntakeAnswersToForms(partyIntakeId: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/realtor/party-intakes/push-to-forms/${partyIntakeId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to push party intake answers to forms:", errorData);
    throw new Error(errorData.error || "Failed to push party intake answers to forms");
  }

  const result = await response.json();
  return result;
}

