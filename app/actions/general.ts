import { createClient } from "@/utils/supabase/server.server";

export const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export async function getAuthToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No access token available");
  }

  return session.access_token;
}
