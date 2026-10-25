import { PartyIntake } from "@/components/files/types/realtor";

/**
 * Normalizes party intakes to ensure party_id is always a string
 */
export function normalizePartyIntakes(intakes: any[]): PartyIntake[] {
  return intakes.map(intake => ({
    ...intake,
    party_id: typeof intake.party_id === 'string' 
      ? intake.party_id 
      : intake.party_id?.id || intake.party_id
  }));
}

/**
 * Normalizes a single party intake to ensure party_id is always a string
 */
export function normalizePartyIntake(intake: any): PartyIntake {
  return {
    ...intake,
    party_id: typeof intake.party_id === 'string' 
      ? intake.party_id 
      : intake.party_id?.id || intake.party_id
  };
}

/**
 * Type guard to check if party_id is in the expected format
 */
export function hasValidPartyId(intake: any): intake is PartyIntake {
  return intake && 
    typeof intake.party_id === 'string' && 
    intake.party_id.length > 0 &&
    !intake.party_id.includes('[object Object]');
}