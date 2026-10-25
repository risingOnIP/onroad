"use server";

import { api } from "@/utils/api-client";

export interface InviteClientParams {
  dealId: string;
  clientEmail: string;
  clientName: string;
  clientId: string;
}

export interface InviteClientResponse {
  success: boolean;
  portalUrl: string;
  message?: string;
}

/**
 * Send portal invitation to a client
 */
export async function sendPortalInvitation(params: InviteClientParams) {
  const body = params;

  try {
    const response = await api.post<InviteClientResponse>(
      `/realtor/deals/send-client-portal-invitation`,
      body
    );

    if (!response.success) {
      throw new Error("Failed to send portal invitation");
    }

    return response as unknown as InviteClientResponse;
  } catch (error) {
    console.error("Error sending portal invitation:", error);
    throw error;
  }
}
