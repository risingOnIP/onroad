import { fetchSignerEmail, requestOtp } from "@/app/actions/jwt/signing-actions";

export async function checkPartyPortalToken(
  signatureCollectionId: string
): Promise<{ token: string; email: string } | null> {
  try {
    const partyToken = localStorage.getItem("partyPortalToken");
    if (!partyToken) return null;


    const response = await fetch(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/${signatureCollectionId}/verify-party-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: partyToken }),
      }
    );

    if (response.ok) {
      const { token: signatureToken, email } = await response.json();
      return { token: signatureToken, email };
    } else {
      localStorage.removeItem("partyPortalToken");
      return null;
    }
  } catch (err) {
    console.error("Error verifying party portal token:", err);
    return null;
  }
}

export async function initializeOtpFlow(
  signatureCollectionId: string
): Promise<string> {
  const { email } = await fetchSignerEmail(signatureCollectionId);
  await requestOtp(signatureCollectionId);
  return email;
}