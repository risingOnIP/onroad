"use server"

import { Search } from "@/components/files/types/client";
import { getAuthToken } from "../general";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;


export async function getAllSearches() {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/client/searches/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get client intake schema:", errorData);
    throw new Error(errorData.error || "Failed to get client intake schema");
  }

  const returning = await response.json() as unknown as Search[]; 
  return returning; 
}

export async function getSearchById(searchId: string) {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/client/searches/id/${searchId}`, {
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get client intake schema:", errorData);
        throw new Error(errorData.error || "Failed to get client intake schema");
    }
    
    return response.json() as unknown as Search; 
}

export async function addSearch(toInsert: Partial<Search>, implicitlyTether: boolean)  {
    const token = await getAuthToken(); 
    const newSearch = toInsert as Search;
    const response = await fetch(`${API_BASE_URL}/client/searches/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newSearch, implicitlyTether }),
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add block:", errorData);
        throw new Error(errorData.error || "Failed to add block");

      }

      return response.json() as unknown as Search; 
    
}

export async function getSearchesWithoutRealtor() {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/client/searches/no-realtor-searches`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get client intake schema:", errorData);
        throw new Error(errorData.error || "Failed to get client intake schema");
    }

    return response.json() as unknown as Search[]; 
} 


