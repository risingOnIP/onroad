"use server";

import { API_BASE_URL } from "../general";

/**
 * Recipients of contact form submissions, read from the comma-separated
 * CONTACT_EMAIL_RECIPIENTS environment variable.
 */
function getContactRecipients(): string[] {
  return (process.env.CONTACT_EMAIL_RECIPIENTS || "admin@example.com")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

export async function sendContactEmail(formData: any) {
  const response = await fetch(`${API_BASE_URL}/send-contact-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...formData, recipients: getContactRecipients() }),
  });

  return response.json();
}