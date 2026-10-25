export interface RealtorClientTether {
  id: string;
  realtor_id: string;
  client_id: string;
  tether_status: "pending" | "active" | "rejected";
  pendingBy: "client" | "realtor";
  search_id: string;
  deal_id: string;
  realtor_email: string;
  client_email: string;
  intake_form_schema: JSON;
  client_answers: JSON;
  created_at: Date;
}

export interface BrokerRealtorTether {
  id: string;
  realtor_id: string;
  created_at: Date;
  status: 'accepted' | 'pending' | 'denied';
  broker_license: string;
broker_id: string;
realtor_email: string;
broker_email: string;
realtor_full_name: string;
broker_full_name: string;
}