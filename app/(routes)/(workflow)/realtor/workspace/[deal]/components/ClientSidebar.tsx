// components/ClientSidebar.tsx

import { getClientIntakesByDealId } from "@/app/actions/realtor/client-intake-actions";
import { ClientIntake } from "@/components/files/types/realtor";
import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { DealPageContext } from "../DealPageContext";
import ClientSidebarSkeleton from "@/components/loading-skeletons/ClientSidebarSkeleton";

interface ClientSidebarProps {
  dealId: string;
}

const ClientSidebar = ({ dealId }: ClientSidebarProps) => {
  const [intakes, setIntakes] = useState<ClientIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setState } = useContext(DealPageContext);

  useEffect(() => {
    const fetchIntakes = async () => {
      // Guard clause: Don't fetch if dealId is not available
      if (!dealId || dealId.trim() === '') {
        console.warn("ClientSidebar: No dealId available, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedIntakes = await getClientIntakesByDealId(dealId);
        setIntakes(fetchedIntakes);
      } catch (err) {
        console.error("Error fetching client intakes:", err);
        setError("Failed to load client intakes");
      } finally {
        setLoading(false);
      }
    };

    fetchIntakes();
  }, [dealId]);

  const handleEditIntake = (intakeId: string) => {
    setState((prev) => ({
      ...prev,
      viewMode: "client-editor",
      selectedClientIntakeId: intakeId,
    }));
  };

  if (loading) {
    return <ClientSidebarSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 min-h-full">
        <p className="text-center text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        Client Intakes
      </h3>

      {intakes.length > 0 ? (
        <div className="space-y-2">
          {intakes.map((intake) => (
            <Card key={intake.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleEditIntake(intake.id)}
                  >
                    <p className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {intake.partyrole_partynumber}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {intake.email}
                    </p>
                  </div>

                  <div className="ml-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditIntake(intake.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      intake.form_visible
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {intake.form_visible ? "Sent" : "Not Sent"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">No client intakes found</p>
        </div>
      )}
    </div>
  );
};

export default ClientSidebar;
