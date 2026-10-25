'use server'

import { getAuthToken } from '@/app/actions/general';

export type BlankFileResult = {
  data: ArrayBuffer | null;
  error?: {
    type: 'TAR_FORM_NOT_UPLOADED' | 'NO_BROKER_TETHER' | 'AUTHENTICATION_REQUIRED' | 'GENERIC';
    message: string;
  };
};

export async function getBlankFile(formType: string): Promise<BlankFileResult> {
  try {

    // Get auth token to pass to backend
    const authToken = await getAuthToken();
    
    // Fetch from backend - it will handle broker form checking
    const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3200/api';
    const pdfUrl = `${API_BASE_URL}/realtor/blank-files/${formType}`;
    
    
    // Build headers with auth token if available
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Fetch the PDF file from the Express backend
    const response = await fetch(pdfUrl, { headers });
    
    if (!response.ok) {
      // Check if it's a TAR form error
      try {
        const errorData = await response.json();
        if (errorData.errorType === 'TAR_FORM_NOT_UPLOADED') {
          return {
            data: null,
            error: {
              type: 'TAR_FORM_NOT_UPLOADED',
              message: errorData.error
            }
          };
        } else if (errorData.errorType === 'NO_BROKER_TETHER') {
          return {
            data: null,
            error: {
              type: 'NO_BROKER_TETHER',
              message: errorData.error
            }
          };
        }
      } catch (e) {
        // Not JSON response, continue with generic error
      }
      
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    // Return as ArrayBuffer
    return { data: await response.arrayBuffer() };
  } catch (error) {
    console.error(`Error loading PDF for form type ${formType}:`, error);
    return {
      data: null,
      error: {
        type: 'GENERIC',
        message: error instanceof Error ? error.message : 'Failed to load PDF'
      }
    };
  }
}