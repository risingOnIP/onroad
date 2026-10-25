'use server'
import { RealtorClientTether } from "@/components/files/types/tethers";
import { getAuthToken } from "../general";


const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;


export async function getRealtorClientTetherBySearchId(searchId: string) {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/tether/realtor-client/by-search-id/${searchId}`, {
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
    
    return response.json() as unknown as RealtorClientTether; 
}


export async function getRealtorClientTetherByDealId(dealId: string) {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/tether/realtor-client/by-deal-id/${dealId}`, {
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
    
    return response.json() as unknown as RealtorClientTether; 
}

export async function getPendingTetherRequestsForRealtor() {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/tether/realtor-client/pending-requests/for-realtor`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get pending tether requests:", errorData);
        throw new Error(errorData.error || "Failed to get pending tether requests");
    }

    return response.json() as unknown as RealtorClientTether[];
}

export async function getPendingTetherRequestsForClient() {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/tether/realtor-client/pending-requests/for-client`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get pending tether requests:", errorData);
        throw new Error(errorData.error || "Failed to get pending tether requests");
    }

    return response.json() as unknown as RealtorClientTether[];
}

export async function acceptPendingTetherRequestByClient(tetherId: string, searchId: string) {
    const token = await getAuthToken(); 
    const response = await fetch(`${API_BASE_URL}/tether/realtor-client/accept-pending-request/by-client/${tetherId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            searchId
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to accept pending tether request:", errorData);
        throw new Error(errorData.error || "Failed to accept pending tether request");
    }

    return response.json() as unknown as RealtorClientTether;
}



