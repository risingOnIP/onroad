'use server';

import { getAuthToken } from '@/app/actions/general';

export async function uploadBrokerForm(formData: FormData) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    // Send the form data to Express API
    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/broker/forms/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload form');
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in uploadBrokerForm:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload form' 
    };
  }
}

export async function getTarForms(): Promise<Array<{ key: string; displayName: string }>> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/realtor/blank-files/metadata/all/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch forms metadata');
    }

    const formMappings = await response.json();
    
    // Filter for TAR forms only and return both key and displayName
    const tarForms = Object.entries(formMappings)
      .filter(([_, mapping]: [string, any]) => mapping.orgCreated === 'TAR')
      .map(([key, mapping]: [string, any]) => ({
        key,
        displayName: mapping.displayName
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return tarForms;
  } catch (error) {
    console.error('Error fetching TAR forms:', error);
    throw error;
  }
}

export async function getBrokerForms() {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/broker/forms/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch broker forms');
    }

    const forms = await response.json();
    return forms;
  } catch (error) {
    console.error('Error in getBrokerForms:', error);
    throw error;
  }
}

export async function deleteBrokerForm(formId: string) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/broker/forms/${formId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete form');
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteBrokerForm:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete form' 
    };
  }
}

export async function updateBrokerForm(formData: FormData) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/broker/forms/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update form');
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in updateBrokerForm:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update form' 
    };
  }
}

export async function getBrokerFormSignedUrl(formId: string): Promise<string> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/broker/forms/signed-url/${formId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get signed URL');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error in getBrokerFormSignedUrl:', error);
    throw error;
  }
}