"use server";

import { getAuthToken } from "@/app/actions/general";

export async function fetchAllSchemas() {
  
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.error("No auth token available - user may not be logged in");
      return {};
    }
    
    
    const url = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/realtor/schema/all`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    
    if (!response.ok) {
      console.error(`Failed to fetch schemas: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(`Failed to fetch schemas: ${response.status}`);
    }
    
    const schemas = await response.json();
    const schemaKeys = Object.keys(schemas);
    
    return schemas;
  } catch (error) {
    console.error("Exception in fetchAllSchemas:", error);
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("=== fetchAllSchemas END WITH ERROR ===");
    return {};
  }
}

export async function fetchAllFormTypes(): Promise<string[]> {
  try {
    const schemas = await fetchAllSchemas();
    const formTypes = Object.keys(schemas);
    
    if (formTypes.length === 0) {
      console.warn("No form types found. This could mean:");
      console.warn("1. The Express backend is not running on port 3200");
      console.warn("2. Authentication failed - user needs to be logged in");
      console.warn("3. The ALL_SCHEMAS object is empty in the backend");
    } else {
    }
    
    return formTypes;
  } catch (error) {
    console.error("Failed to fetch form types:", error);
    return [];
  }
}

export async function fetchAllPossibleFormTypes(): Promise<string[]> {
  try {
    // Get available schema types
    const schemaFormTypes = await fetchAllFormTypes();
    
    // Get existing form types from database
    const token = await getAuthToken();
    if (!token) {
      console.error("No auth token available for fetching existing form types");
      return schemaFormTypes;
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/realtor/forms/all-form-types`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    let existingFormTypes: string[] = [];
    if (response.ok) {
      const data = await response.json();
      existingFormTypes = data.formTypes || [];
    }
    
    // Combine and deduplicate
    const allFormTypes = new Set<string>([...schemaFormTypes, ...existingFormTypes]);
    
    
    return Array.from(allFormTypes);
  } catch (error) {
    console.error("Failed to fetch all possible form types:", error);
    // Fallback to just schema types if something goes wrong
    return await fetchAllFormTypes();
  }
}