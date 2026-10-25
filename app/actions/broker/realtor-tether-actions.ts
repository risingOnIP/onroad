'use server'

import { API_BASE_URL, getAuthToken } from "../general";

export async function getAllRealtorTethers() {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/all`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch realtor tethers:', errorData);
        throw new Error(errorData.error || 'Failed to fetch realtor tethers');
    }

    const tethers = await response.json();
    return tethers;
}

export async function getAcceptedRealtorTethers() {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/accepted`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch accepted realtor tethers:', errorData);
        throw new Error(errorData.error || 'Failed to fetch accepted realtor tethers');
    }

    const tethers = await response.json();
    return tethers;
}

export async function acceptRealtorRequest(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/accept-realtor-request/${tetherId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to accept realtor request:', errorData);
        throw new Error(errorData.error || 'Failed to accept realtor request');
    }

    const tether = await response.json();
    return tether;
}

export async function denyRealtorRequest(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/deny/${tetherId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to deny realtor request:', errorData);
        throw new Error(errorData.error || 'Failed to deny realtor request');
    }

    const tether = await response.json();
    return tether;
}

export async function createRealtorTetherByEmail(realtorEmail: string, deleteExisting: boolean = false) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ realtorEmail, deleteExisting })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create realtor tether:', errorData);
        throw new Error(errorData.error || 'Failed to create realtor tether');
    }

    const tether = await response.json();
    return tether;
}

export async function deleteRealtorTether(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/delete/${tetherId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete realtor tether:', errorData);
        throw new Error(errorData.error || 'Failed to delete realtor tether');
    }

    const result = await response.json();
    return result;
}

export async function cancelPendingRealtorTether(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/broker/realtor-broker-tether/cancel/${tetherId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to cancel pending tether:', errorData);
        throw new Error(errorData.error || 'Failed to cancel pending tether');
    }

    const result = await response.json();
    return result;
}