"use client";

import { useState, useEffect } from "react";

import ActionItems, { ActionItem } from "@/components/files/ActionItems";
import PropertySearches from "../search/components/PropertySearches";
import PropertyTable from "./components/main/PropertyTable";
import {
  getPendingTetherRequestsForClient,
} from "@/app/actions/tethers/realtor-client-tether-actions";
import ExplicitTetheringDialog from "./components/main/ExplicitTetheringDialog";

export default function ClientDashboardPage() {

  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [explicitTether, setExplicitTether] = useState<{explicitTetherId: string, realtorEmail: string} | null>(null);
  
  

  const fetchActionItems = async () => {
    //get signature requests here
    // get pending realtor requests

    const pendingTethers = await getPendingTetherRequestsForClient();
    const setting: ActionItem[] = pendingTethers.map((tether) => {
      return {
        title: "Someone has requested you to be their realtor.",
        subtitle: `Click here for a realtor to accept you with email id of: ${tether.realtor_email}`,
        actionType: "tether",
        onClick: () => setExplicitTether({explicitTetherId: tether.id, realtorEmail: tether.realtor_email}),
      };
    });

    setActionItems(setting);
  }

  useEffect(() => {
    fetchActionItems();
  }, []);


  const properties = [
    {
      address: "123 Maple Street, Austin, TX",
      client: "Jennifer & David Smith",
      price: "$425,000",
      status: "In Progress",
      type: "selling",
      lastUpdate: "Feb 25, 2025",
    },
  ];


  const handleFilter = () => console.log("Filtering");
  const handleEdit = (property: string) => console.log("Edit:", property);
  const handleMore = (property: string) => console.log("More:", property);

  return (
    <>
      <ActionItems actions={actionItems} />
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        Active Property Searches
      </h2>
      <PropertySearches statusShown={"active"} />
      <PropertyTable
        properties={properties}
        onFilter={handleFilter}
        onEdit={handleEdit}
        onMore={handleMore}
      />

      {explicitTether?.explicitTetherId && (
        <ExplicitTetheringDialog
          explicitTether={explicitTether}
          setExplicitTether={setExplicitTether}
          onTetherSuccess ={() => fetchActionItems()}
        />
      )}
    </>
  );
}
