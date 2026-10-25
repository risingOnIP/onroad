"use server";

import { API_BASE_URL } from "../general";
import { getAuthToken } from "../general";
import { aiPartyIntakeQuestionGeneration } from "@/components/files/types/realtor";


export async function getAiClientIntakeQuestionGeneration(
  question: string
): Promise<aiPartyIntakeQuestionGeneration | null> {
  const token = await getAuthToken();

  if (!token) {
    console.error("Server-side auth token not found.");
    return null;
  }

  const functionType = "client_intake_question_generation";
  const request = question;


  const res = await fetch(`${API_BASE_URL}/realtor/ai-actions/small-generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      functionType,
      request,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error("AI client intake question generation request failed.");
    return null;
  }

  const data = await res.json();

  return data as unknown as aiPartyIntakeQuestionGeneration;
}