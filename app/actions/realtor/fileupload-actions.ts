'use server'

import { getAuthToken } from '@/app/actions/general';

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export interface FileInfo {
  fileName: string;
  size: number;
  lastModified: string;
  url?: string;
}

export interface UploadConstraints {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  bucketName: string;
}

// Upload a PDF file
export async function uploadFile(file: File, folder?: string) {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('pdf', file);
    
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`${API_BASE_URL}/file-upload/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// List user's uploaded files
export async function listFiles(): Promise<FileInfo[]> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/file-upload/files`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

// Get signed URL for file download
export async function getDownloadUrl(fileName: string): Promise<string> {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/file-upload/get-signed-url/${encodeURIComponent(fileName)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to get download URL: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

// Delete a file
export async function deleteFile(fileName: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/file-upload/files/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Get upload constraints and bucket info
export async function getUploadInfo(): Promise<UploadConstraints> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/file-upload/upload-info`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get upload info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting upload info:', error);
    throw error;
  }
} 