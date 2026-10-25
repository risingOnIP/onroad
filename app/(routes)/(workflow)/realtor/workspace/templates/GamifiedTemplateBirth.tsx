// components/GamifiedTemplateBirth.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import TemplateSelectionPage from "./TemplateSelectionPage";
import TemplateNamingPage from "./TemplateNamingPage";
import { cn } from "@/lib/utils";
import { addTemplateType } from "@/app/actions/realtor/template-actions";
import { Template } from "@/components/files/types/realtor";
import { addPartyIntakeTemplate } from "@/app/actions/realtor/client-intake-template-actions";

// Types for props
export interface CellOption {
  id: string;
  row: string;
  column: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface GamifiedTemplateBirthProps {
  rowLabels: string[];
  columnLabels: string[];
  cellOptions: CellOption[];
  setSelectedTemplateType: (type: string) => void;
  selectedTemplateType: string | null;
}

const GamifiedTemplateBirth: React.FC<GamifiedTemplateBirthProps> = ({
  rowLabels,
  columnLabels,
  cellOptions,
  setSelectedTemplateType,
  selectedTemplateType,
}) => {
  const [page, setPage] = useState<"template_selection" | "naming">(
    "template_selection"
  );
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [supabaseTable, setSupabaseTable] = useState<
    "client_intake" | "transaction_forms" | null
  >(null);
  const [nameChangeDisabled, setNameChangeDisabled] = useState(false);
  const router = useRouter();

  const activeClasses =
    "px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium";
  const inactiveClasses = "px-3 py-1 rounded-full bg-gray-100 text-gray-700";

  return (
    <div className="mb-5 flex flex-wrap justify-start md:justify-center items-center space-x-1 text-sm">
      {/* Step 1: Select Template */}
      <span
        className={cn(
          page === "template_selection" ? activeClasses : inactiveClasses,
          "cursor-pointer"
        )}
        onClick={() => {
          setPage("template_selection");
          setNameChangeDisabled(false);
          setTemplateName("");
          setDescription("");
          setSupabaseTable(null);
        }}
      >
        Select Template
      </span>
      <span className="text-gray-500">&rarr;</span>
      {/* Step 2: Name Template */}
      <span
        className={cn(
          page === "naming" ? activeClasses : inactiveClasses,
          "cursor-pointer"
        )}
        onClick={() => (selectedTemplateType ? setPage("naming") : null)}
      >
        Name Template
      </span>
      {/* OUTER CARD: FIXED WIDTH (w-full) & MIN HEIGHT */}
      <Card className="w-full border-none shadow-lg">
        <CardContent className="p-4 min-h-[680px] flex flex-col">
          {page === "template_selection" && (
            <TemplateSelectionPage
              rowLabels={rowLabels}
              columnLabels={columnLabels}
              cellOptions={cellOptions}
              setSelectedTemplateType={setSelectedTemplateType}
              selectedTemplateType={selectedTemplateType}
              onContinue={() => setPage("naming")}
            />
          )}
          {page === "naming" && selectedTemplateType && (
            <TemplateNamingPage
              onContinue={async (selectedTemplateType: string, templateName: string, description: string, supabaseTable: "client_intake" | "transaction_forms") => {
                setNameChangeDisabled(true);
                if (supabaseTable==="transaction_forms")  {
                const template: Template = await addTemplateType(`${selectedTemplateType}-${templateName}`);
                // Redirect to modify page with query params
                router.push(
                  `/realtor/workspace/templates/modify/transaction-form/${template.id}`
                )
                }
                else {
                  const template: Template = await addPartyIntakeTemplate(`${selectedTemplateType}-${templateName}`);
                // Redirect to modify page with query params
                router.push(
                  `/realtor/workspace/templates/modify/client-intake/${template.id}`
                )
                }
              }}
              onBack={() => {
                setPage("template_selection");
                setTemplateName("");
                setDescription("");
                setSupabaseTable(null);
                setNameChangeDisabled(false);
              }}
              cellOptions={cellOptions}
              selectedTemplateType={selectedTemplateType}
              templateName={templateName}
              description={description}
              setTemplateName={setTemplateName}
              setDescription={setDescription}
              setSupabaseTable={setSupabaseTable}
              supabaseTable={supabaseTable}
              nameChangeDisabled={nameChangeDisabled}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamifiedTemplateBirth;
