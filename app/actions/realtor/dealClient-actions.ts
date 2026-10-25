'use server'
import { Party, Deals_Parties, DealParty } from '@/components/files/types/realtor'
import { API_BASE_URL,  getAuthToken } from '../general'

export async function createDealPartyRow(dealId: string, parties: {
    role: string;
    realtorIsRepresenting: boolean; 
    partyNumber: number; 
    party: Omit<Party, "id" | "created_at" | "form_information" | "notes" | "phone_number" | "realtor_id">;
  }[]) {
  const token = await getAuthToken()

  // Validate required fields before making API call
  for (const [index, partyData] of parties.entries()) {
    if (!partyData.party?.email) {
      throw new Error(`Party email is required for party at index ${index}`)
    }
    if (!partyData.party?.full_name) {
      throw new Error(`Party full name is required for party at index ${index}`)
    }
  }



  const response = await fetch(`${API_BASE_URL}/realtor/deals-parties/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ deal_id: dealId, parties: parties })
  })

  if (!response.ok) {   
    const errorData = await response.json().catch(() => ({}))
    console.error('API Error Response:', errorData)
    throw new Error(errorData.error || 'Failed to create deal party row')
  }

  return response.json() as unknown as Deals_Parties
}


export async function getAllDealsParties() {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals-parties/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get all deals parties')
  }

  return response.json() as unknown as Deals_Parties[]
}

export async function removeDealParty(dealId: string, partyId: string) {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}/realtor/deals-parties/remove`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ deal_id: dealId, party_id: partyId })
  })

  if (!response.ok) {
    throw new Error('Failed to remove party from deal')
  }

  return response.json()
}

// Deal Option Party Functions
export async function createDealOptionPartyRow(dealOptionId: string, parties: {
    role: string;
    realtorIsRepresenting: boolean; 
    partyNumber: number; 
    party: Omit<Party, "id" | "created_at" | "form_information" | "notes" | "phone_number" | "realtor_id">;
  }[]) {
  const token = await getAuthToken()

  // Validate required fields before making API call
  for (const [index, partyData] of parties.entries()) {
    if (!partyData.party?.email) {
      throw new Error(`Party email is required for party at index ${index}`)
    }
    if (!partyData.party?.full_name) {
      throw new Error(`Party full name is required for party at index ${index}`)
    }
  }


  const response = await fetch(`${API_BASE_URL}/realtor/deal-option-parties/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ deal_option_id: dealOptionId, parties: parties })
  })

  if (!response.ok) {   
    const errorData = await response.json().catch(() => ({}))
    console.error('API Error Response:', errorData)
    throw new Error(errorData.error || 'Failed to create deal option party row')
  }

  return response.json() as unknown as Deals_Parties
}

export async function getDealPartiesByDealOptionId(dealOptionId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deal-option-parties/${dealOptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Error response:', response.status, response.statusText, errorText)
    throw new Error(`Failed to fetch deal option parties: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const returning = await response.json() as unknown as DealParty[]
  return returning
}

export async function removeDealOptionParty(dealOptionId: string, partyId: string) {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}/realtor/deal-option-parties/remove`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ deal_option_id: dealOptionId, party_id: partyId })
  })

  if (!response.ok) {
    throw new Error('Failed to remove party from deal option')
  }

  return response.json()
}

export async function getPartiesByDealId(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/parties/${dealId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch deal parties')
  }

  return response.json() as unknown as Party[]
}

export async function getAllDealOptionsWithParties(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/dealOptions/${dealId}/with-parties`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch deal options with parties')
  }

  return response.json()
}

export async function getDealPartiesByDealId(dealId: string) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deals-parties/by-deal-id/${dealId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch deal parties')
  }

  return response.json() as unknown as Deals_Parties[]
}

export async function getDealPartiesByDealAndOptionId(dealId: string, dealOptionId: string) {

  
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/realtor/deal-option-parties/get-deal-wide-and-deal-option-parties/${dealId}/${dealOptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    console.error("Failed to fetch deal parties", {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error('Failed to fetch deal parties')
  }

  const parties = await response.json() as unknown as DealParty[]
  
  
  return parties
}

export async function getDealOptionPartiesWithFullInformation(dealOptionId: string): Promise<{party: Party, role: string, partyNumber: number}[]> {
  const token = await getAuthToken()
  const PartiesResponse = await fetch(`${API_BASE_URL}/realtor/parties/all`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!PartiesResponse.ok) {
    throw new Error('Failed to fetch deal option parties with full information')
  }

  const dealPartiesResponse = await fetch(`${API_BASE_URL}/realtor/deal-option-parties/${dealOptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!dealPartiesResponse.ok) {
    throw new Error('Failed to fetch deal option parties with full information')
  }

  const parties = await PartiesResponse.json() as unknown as Party[]




  const dealParties = await dealPartiesResponse.json() as unknown as DealParty[]


  const OptionParties = parties.filter(party => dealParties.some(dealParty => dealParty.party_id === party.id)).map(party => ({ party: party, role: dealParties.find(dealParty => dealParty.party_id === party.id)?.party_role as string, partyNumber: dealParties.find(dealParty => dealParty.party_id === party.id)?.partyNumber as number }))


  return OptionParties
}

