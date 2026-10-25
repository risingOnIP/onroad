"use client";

export async function isCurrentStepSigner(
  formId: string,
  partyEmail: string,
  token: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL;
  const email = partyEmail;

  const response = await fetch(
    `${baseUrl}/jwt/party-portal/is-current-step-signer/${formId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || "Failed to fetch stages");
  }

  return response.json() as Promise<boolean>;
}

export async function getUserActionType(
  formId: string,
  partyEmail: string,
  token: string
): Promise<{ actionAs: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL;
  const email = partyEmail;

  const response = await fetch(
    `${baseUrl}/jwt/party-portal/get-user-action-type/${formId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get user action type");
  }

  return response.json() as Promise<{ actionAs: "signer"  | "delegator" | "viewer" }>;
}
