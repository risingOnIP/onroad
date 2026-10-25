"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GamifiedTemplateBirth from "./GamifiedTemplateBirth";
import { Button } from "@/components/ui/button";
import GamifiedTemplateModification from "./GamifiedTemplateModification";
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/solid";
import { HomeIcon, MapIcon, ArrowLeftIcon } from "lucide-react";
import { CellOption } from "./GamifiedTemplateBirth";
import Link from "next/link";
import { ChatInterface } from "@/components/ai/chat-interface";
import { RealtorPageNavigation } from "@/components/files/types/realtor";

const CELL_OPTIONS: CellOption[] = [
  {
    id: "buy-residential",
    row: "Buy",
    column: "Residential",
    title: "Buy Residential",
    description: "Single-family homes, condos, townhouses",
    Icon: HomeIcon,
  },
  {
    id: "buy-commercial",
    row: "Buy",
    column: "Commercial",
    title: "Buy Commercial",
    description: "Office buildings, retail spaces, warehouses",
    Icon: BuildingOffice2Icon,
  },
  {
    id: "buy-improved_land",
    row: "Buy",
    column: "Improved Land",
    title: "Buy Improved Land",
    description: "Developed lots with utilities & infrastructure",
    Icon: BuildingStorefrontIcon,
  },
  {
    id: "buy-unimproved_land",
    row: "Buy",
    column: "Unimproved Land",
    title: "Buy Unimproved Land",
    description: "Undeveloped parcels & vacant lots",
    Icon: MapIcon,
  },
  {
    id: "sell-residential",
    row: "Sell",
    column: "Residential",
    title: "Sell Residential",
    description: "List & sell residential properties",
    Icon: HomeIcon,
  },
  {
    id: "sell-commercial",
    row: "Sell",
    column: "Commercial",
    title: "Sell Commercial",
    description: "Market commercial real estate",
    Icon: BuildingOffice2Icon,
  },
  {
    id: "sell-improved_land",
    row: "Sell",
    column: "Improved Land",
    title: "Sell Improved Land",
    description: "Developed land ready for construction",
    Icon: BuildingStorefrontIcon,
  },
  {
    id: "sell-unimproved_land",
    row: "Sell",
    column: "Unimproved Land",
    title: "Sell Unimproved Land",
    description: "Undeveloped property sales",
    Icon: MapIcon,
  },
  {
    id: "rent-residential",
    row: "Rent",
    column: "Residential",
    title: "Rent Residential",
    description: "Rent out homes & apartments",
    Icon: HomeIcon,
  },
  {
    id: "rent-commercial",
    row: "Rent",
    column: "Commercial",
    title: "Rent Commercial",
    description: "Lease retail or office space",
    Icon: BuildingOffice2Icon,
  },
  {
    id: "rent-improved_land",
    row: "Rent",
    column: "Improved Land",
    title: "Rent Improved Land",
    description: "Lease developed land",
    Icon: BuildingStorefrontIcon,
  },
  {
    id: "rent-unimproved_land",
    row: "Rent",
    column: "Unimproved Land",
    title: "Rent Unimproved Land",
    description: "Lease vacant land",
    Icon: MapIcon,
  },
  {
    id: "lease-residential",
    row: "Lease",
    column: "Residential",
    title: "Lease Residential",
    description: "Long-term lease, single or multi-family",
    Icon: HomeIcon,
  },
  {
    id: "lease-commercial",
    row: "Lease",
    column: "Commercial",
    title: "Lease Commercial",
    description: "Long-term lease, commercial building",
    Icon: BuildingOffice2Icon,
  },
  {
    id: "lease-improved_land",
    row: "Lease",
    column: "Improved Land",
    title: "Lease Improved Land",
    description: "Long-term lease, developed land",
    Icon: BuildingStorefrontIcon,
  },
  {
    id: "lease-unimproved_land",
    row: "Lease",
    column: "Unimproved Land",
    title: "Lease Unimproved Land",
    description: "Long-term lease, vacant parcel",
    Icon: MapIcon,
  },
];

const ROW_LABELS = ["Buy", "Sell", "Rent", "Lease"];
const COLUMN_LABELS = [
  "Residential",
  "Commercial",
  "Improved Land",
  "Unimproved Land",
];

const TemplatePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"create" | "modify">("create");
  const [editFormType, setEditFormType] = useState<"client_intake" | "transaction_forms" | null>(null);

  const [currentNavigation, setCurrentNavigation] = useState<RealtorPageNavigation>({
    area: "templates",
    templates: {
      tab: mode,
    }
  });


  //make a useeffect for when setmode changes then current navigation changes
  useEffect(() => {
    setCurrentNavigation({
      area: "templates",
      templates: {
        tab: mode,
      } 
    });
  }, [mode]);

  //make a useeffect for when seteditformtype changes then current navigation changes
  useEffect(() => {
    if (editFormType) {
    setCurrentNavigation({
      area: "templates",
      templates: {
        tab: mode,
        modify: {
          type: editFormType,
          }
        }
      });
    } else {
      setCurrentNavigation({
        area: "templates",
        templates: {
          tab: mode,
        }
      });
    }
  }, [editFormType]);


  // Read mode and type from URL params on mount
  useEffect(() => {
    const urlMode = searchParams.get('mode') as "create" | "modify";
    const urlType = searchParams.get('type') as "client_intake" | "transaction_forms" | null;
    
    if (urlMode === 'modify') {
      setMode('modify');
    } else {
      // Default to 'create' if no mode param or if mode is 'create'
      setMode('create');
    }

    // Set editFormType based on URL type parameter
    if (urlType === 'client_intake') {
      setEditFormType('client_intake');
      setCurrentNavigation({
        area: "templates",
        templates: {
          tab: urlMode,
          modify: {
            type: urlType,
          }
        }
      });
    } else if (urlType === 'transaction_forms') {
      setEditFormType('transaction_forms');
      setCurrentNavigation({
        area: "templates",
        templates: {
          tab: urlMode,
        }
      });
    } else {
      // Default to null if no type parameter
      setEditFormType(null);
      setCurrentNavigation({
        area: "templates",
        templates: {
          tab: urlMode,
        }
      });
    }
  }, [searchParams]);

  // Update URL when mode or editFormType state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('mode', mode);
    
    // Only add type parameter if editFormType is not null and mode is edit
    if (mode === 'modify' && editFormType) {
      params.set('type', editFormType);
    } else {
      params.delete('type');
    }
    
    const newUrl = `?${params.toString()}`;
    router.push(`/realtor/workspace/templates${newUrl}`, { scroll: false });
  }, [mode, editFormType, router, searchParams]);

  //states for the gamified template builder
  const [selectedTemplateType, setSelectedTemplateType] = useState<
    string | null
  >(null);

  return (
    <div className="flex-grow flex w-full h-full flex-col my-4">
      {/* Subtle back button above the card */}
      <div className="mx-4 mb-2">
        <Link href="/realtor/workspace">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:underline flex items-center gap-1 px-2 py-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mx-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            OnRoad Template Builder
          </h1>
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setMode("create");
                setEditFormType(null);
              }}
              variant={mode === "create" ? "default" : "outline"}
              className={
                mode === "create"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                  : ""
              }
            >
              Create New Template
            </Button>
            <Button
              onClick={() => {
                setMode("modify");
                setSelectedTemplateType(null);
              }}
              variant={mode === "modify" ? "default" : "outline"}
              className={
                mode === "modify"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                  : ""
              }
            >
              Modify Existing
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-grow">
        {mode === "create" ? (
          <GamifiedTemplateBirth
            rowLabels={ROW_LABELS}
            columnLabels={COLUMN_LABELS}
            cellOptions={CELL_OPTIONS}
            setSelectedTemplateType={setSelectedTemplateType}
            selectedTemplateType={selectedTemplateType}
          />
        ) : (
          <GamifiedTemplateModification 
            editFormType={editFormType}
            setEditFormType={setEditFormType}
          />
        )}
      </div>
      
      {/* AI Chat Interface */}
      <ChatInterface 
        userRole="realtor"
        pageNavigation={currentNavigation}
      />
    </div>
  );
};

const TemplatePage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <TemplatePageContent />
    </Suspense>
  );
};

export default TemplatePage;
