'use server'
import { Party, Deal, DealParty, StepStatus } from '@/components/files/types/realtor'
import { API_BASE_URL,  getAuthToken } from '../general'


export async function getAllDeals() {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Failed to fetch deals:', errorData)
    throw new Error(errorData.error || 'Failed to fetch deals')
  }

  const deals = await response.json() as Deal[];
  return deals;
}

export async function createDeal(deal: Omit<Deal, 'id' | 'user_id' | 'created_at' >, 
  parties: {
    role: string;
    realtorIsRepresenting: boolean; 
    partyNumber: number; 
    party: Omit<Party, "id" | "created_at" | "form_information" | "notes" | "phone_number" | "realtor_id">;
  }[]
) {
  const token = await getAuthToken()


  const response = await fetch(`${API_BASE_URL}/realtor/deals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ deal, parties })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create deal')
  }

  const result = await response.json()
  return result.deal as unknown as Deal // Return just the deal data from the response
}

export async function getDeal(id: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch deal')
  }

  return response.json()
}

export async function updateDeal(id: string, dealData: Partial<Deal>) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ deal: dealData })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('API Error Response:', errorData)
    throw new Error(errorData.error || 'Failed to update deal')
  }

  return response.json()
}

export async function deleteDeal(id: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to delete deal')
  }

  return response.json()
} 

export async function markDealComplete(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals//mark-complete/${dealId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to mark deal complete')
  }

  return response.json() as unknown as Deal; 

}

export async function getDealClients(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${dealId}/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })


  if (!response.ok) {
    throw new Error('Failed to fetch deal clients')
  }

  const returning = await response.json()


  return returning as unknown as DealParty[]
}

export async function getClientIntakesByDealId(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/client-intakes/deal/${dealId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch client intakes')
  }

  return response.json()
}

export async function sendDealsToClients(dealIds: string[], emailAddresses: string[], realtorName: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dealIds, emailAddresses, realtorName })
  })

  if (!response.ok) {
    throw new Error('Failed to send deals to clients')
  }

  return response.json()
}

export async function getDealStepsStatuses(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${dealId}/steps-statuses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })  

  if (!response.ok) {
    throw new Error('Failed to fetch deal steps statuses')
  }

  return response.json()
}

export async function updateDealStepsStatuses(dealId: string, stepsStatuses: {stepId: string, status: StepStatus}[]) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals/${dealId}/steps-statuses`, {
    method: 'PUT',
    headers: {    
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stepsStatuses })
  })  

  if (!response.ok) {
    throw new Error('Failed to update deal steps statuses')
  }

  return response.json() as unknown as Deal; 
}




