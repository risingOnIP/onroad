export type SearchFilters = {
    searchName: string;
    propertyType:
      | "residential"
      | "commercial"
      | "improved_land"
      | "unimproved_land";
    minBudget: number;
    maxBudget: number;
    schoolZone: number; // 1 to 10 where 10 is the highest priority
    location: string;
  };
  

  export interface Search {
    id: string, 
    party_id: string, 
    search_name: string, 
    searchFilters: SearchFilters,
    party_intake_answers: JSON, 
    status: "active" | "closed", 
    realtor_email: string, 
    created_at: string,
}