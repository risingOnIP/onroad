"use server";

import { getAuthToken } from "../general";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function sendFormForReview(formId: string) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/realtor/forms/${formId}/send-for-review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to send form for review');
  }

  return response.json();
}

export async function sendMultipleFormsForReview(formIds: string[]) {
  const token = await getAuthToken();
  
  // Send all forms for review in parallel
  const promises = formIds.map(formId => 
    fetch(`${API_BASE_URL}/realtor/forms/${formId}/send-for-review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
  );

  const responses = await Promise.allSettled(promises);
  
  const failed = responses.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    throw new Error(`Failed to send ${failed.length} form(s) for review`);
  }

  const results = await Promise.all(
    responses
      .filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled')
      .map(r => r.value.json())
  );

  return results;
}