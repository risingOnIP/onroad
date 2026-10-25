"use client";

import React, { useState, useEffect } from "react";
import {
  Party,
  Deal,
  Deals_Parties,
  Profile,
  RealtorPageNavigation,
} from "@/components/files/types/realtor";
import {
  getAllParties,
  insertPartyApiCall,
  updatePartyApiCall,
} from "@/app/actions/realtor/client-actions";
import { getAllDeals } from "@/app/actions/realtor/deal-actions";
import { getProfile } from "@/app/actions/realtor/profile-actions";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getAllDealsParties } from "@/app/actions/realtor/dealClient-actions";
import ClientsTable from "./components/ClientsTable";
import { ChatInterface } from "@/components/ai/chat-interface";

export default function CRMPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealParties, setDealParties] = useState<Deals_Parties[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  
  const currentNavigation : RealtorPageNavigation = {
    area: "crm",
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesData, dealsData, dealPartiesData, profileData] =
          await Promise.all([
            getAllParties(),
            getAllDeals(),
            getAllDealsParties(),
            getProfile("realtor"),
          ]);

        // Filter parties to only include those where realtorIsRepresenting or realtor_is_representing is true
        const representedDealParties = dealPartiesData.filter(
          (dealParty) => dealParty.realtorIsRepresenting
        );
        const representedPartyIds = new Set(
          representedDealParties.map((dealParty) => dealParty.party_id)
        );
        const representedParties = partiesData.filter((party) =>
          representedPartyIds.has(party.id)
        );

        setParties(representedParties);
        setDeals(dealsData);
        setDealParties(dealPartiesData);
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addParty = async (
    party: Omit<Party, "id" | "realtor_id" | "created_at">
  ) => {
    const insertedParty: Party = await insertPartyApiCall(party);
    setParties((prev) => [...prev, insertedParty]);
  };

  const updateParty = (updated: Party) => {
    setParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Called whenever any form (full, phone, notes, email) is saved
  const onEditFormSaved = async (updatedParty: Party) => {
    // Optimistically update the UI first
    updateParty(updatedParty);

    try {
      // Then try to save to backend
      const databaseSavedParty: Party = await updatePartyApiCall(
        updatedParty,
        updatedParty.id
      );
      // Update with the server response in case there were any server-side changes
      updateParty(databaseSavedParty);
    } catch (error) {
      // Revert the optimistic update on error
      console.error("Failed to save party:", error);
      // Revert to the previous state
      setParties((prev) =>
        prev.map((p) =>
          p.id === updatedParty.id
            ? parties.find((orig) => orig.id === p.id)!
            : p
        )
      );
      // You might want to show a toast notification here
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center">
        <Button variant="outline" className="mr-4">
          <Link href="/realtor/workspace"> Back</Link>
        </Button>

        <h1 className="text-2xl font-semibold flex-1 text-center">
          Real Estate CRM & Transactions
        </h1>
      </div>
      {loading ? (
        <div className="border rounded bg-white">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center py-2 gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ClientsTable
          clients={parties}
          dealClients={dealParties}
          deals={deals}
          onAdd={addParty}
          onEditFormSaved={onEditFormSaved}
          loading={loading}
          realtorName={
            profile
              ? `${profile.firstName} ${profile.lastName}`
              : "Unknown Realtor"
          }
        />
      )}
      
      {/* AI Chat Interface */}
      <ChatInterface 
        userRole="realtor"
        pageNavigation={currentNavigation}
      />
    </div>
  );
}
