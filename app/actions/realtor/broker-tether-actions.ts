'use server'

import { API_BASE_URL, getAuthToken } from "../general";

export async function createBrokerRealtorTetherByBrokerLicense(brokerLicense: string, deleteExisting: boolean = false) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brokerLicense, deleteExisting })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create broker-realtor tether:', errorData);
        throw new Error(errorData.error || 'Failed to create broker-realtor tether');
    }

    const tether = await response.json();
    return tether;
}

export async function getAllBrokerRealtorTethers() {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/all`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch broker-realtor tethers:', errorData);
        throw new Error(errorData.error || 'Failed to fetch broker-realtor tethers');
    }

    const tethers = await response.json();
    return tethers;
}

export async function getAcceptedBrokerRealtorTethers() {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/accepted`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch accepted broker-realtor tethers:', errorData);
        throw new Error(errorData.error || 'Failed to fetch accepted broker-realtor tethers');
    }

    const tethers = await response.json();
    return tethers;
}

export async function acceptBrokerTetherConnection(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/acceptTetherConnection`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tetherId })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to accept tether connection:', errorData);
        throw new Error(errorData.error || 'Failed to accept tether connection');
    }

    const tether = await response.json();
    return tether;
}

export async function deleteBrokerRealtorTether(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/delete/${tetherId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete broker tether:', errorData);
        throw new Error(errorData.error || 'Failed to delete broker tether');
    }

    const result = await response.json();
    return result;
}

export async function cancelPendingBrokerRealtorTether(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/cancel/${tetherId}`, {
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

export async function acceptBrokerRequest(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/accept/${tetherId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to accept broker request:', errorData);
        throw new Error(errorData.error || 'Failed to accept broker request');
    }

    const tether = await response.json();
    return tether;
}

export async function denyBrokerRequest(tetherId: string) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/realtor/broker-tether/deny/${tetherId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to deny broker request:', errorData);
        throw new Error(errorData.error || 'Failed to deny broker request');
    }

    const tether = await response.json();
    return tether;
}