import { getAllDeals } from "@/app/actions/realtor/deal-actions";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { Deal, DealOptionFormMerged } from "@/components/files/types/realtor";
import { redirect } from "next/navigation";
import React from "react";
import RWMain from "./components/mainContent/RWMain";

export const dynamic = 'force-dynamic';

interface DealWithOptions extends Deal {
  dealOptions?: DealOptionFormMerged[];
  updatedAt?: Date;
}

export default async function Workspace() {
  let dealData: Deal[];
  try {
    dealData = await getAllDeals() as Deal[];
  } catch (error) {
    console.error("Error fetching deals:", error);
    redirect("/error");
  }
  
  // Fetch deal options for each deal
  const dealsWithOptions: DealWithOptions[] = await Promise.all(
    dealData.map(async (deal) => {
      try {
        const dealOptions = await getDealOptionsWithForms(deal.id);
        // Use the first deal option's created_at as the deal's updated date
        const updatedAt = dealOptions.length > 0 ? dealOptions[0].created_at : deal.created_at;
        return {
          ...deal,
          dealOptions,
          updatedAt
        };
      } catch (error) {
        console.error(`Error fetching options for deal ${deal.id}:`, error);
        return {
          ...deal,
          dealOptions: [],
          updatedAt: deal.created_at
        };
      }
    })
  );
  
  return (
      <RWMain deals={dealsWithOptions} />
  );
}
