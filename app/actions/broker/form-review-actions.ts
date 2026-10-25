"use server";

import { getAuthToken } from "../general";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export interface FormForReview {
  id: string;
  form_type: string;
  review_stage: 'not_sent' | 'reviewing' | 'approved';
  form_response: any;
  finalized_pdf?: string;
  file_upload_pdf?: string;
  deal_option_id: string;
  created_at: string;
  deal_option?: {
    id: string;
    address: string;
    deal?: {
      id: string;
      deal_name: string;
      realtor?: {
        id: string;
        full_name: string;
        email: string;
      };
    };
  };
}

export async function getFormsForReview() {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/broker/forms-review`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch forms for review');
  }

  return response.json() as Promise<FormForReview[]>;
}

export async function updateFormReviewStage(
  formId: string, 
  reviewStage: 'not_sent' | 'reviewing' | 'approved'
) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/broker/forms-review/${formId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ review_stage: reviewStage })
  });

  if (!response.ok) {
    throw new Error('Failed to update form review stage');
  }

  return response.json();
}