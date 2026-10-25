"use client";

import React, { useEffect, useState } from "react";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
interface ClientIntakeTemplate {
  id: string;
  name: string;
  [key: string]: any;
}
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAllTemplates } from "@/app/actions/realtor/template-actions";
import { getAllPartyIntakeTemplates } from "@/app/actions/realtor/client-intake-template-actions";
import { Template } from "@/components/files/types/realtor";
import { useRouter } from "next/navigation";
import { Building, Landmark, Map } from "lucide-react";
interface GamifiedTemplateModificationProps {
  editFormType: "client_intake" | "transaction_forms" | null;
  setEditFormType: (type: "client_intake" | "transaction_forms" | null) => void;
}

const GamifiedTemplateModification: React.FC<GamifiedTemplateModificationProps> = ({
  editFormType,
  setEditFormType
}) => {
  const router = useRouter();
  const [currentTemplates, setCurrentTemplates] = useState<Template[]>([]);
  const [currentClientIntakeTemplates, setCurrentClientIntakeTemplates] =
    useState<ClientIntakeTemplate[]>([]); 


  // Three dropdown states
  const [firstFilter, setFirstFilter] = useState<string>("");
  const [secondFilter, setSecondFilter] = useState<string>("");

  useEffect(() => {
    const fetchTemplates = async () => {
      const templates = await getAllTemplates();
      setCurrentTemplates(templates);
    }
    fetchTemplates();
  }, []);
  

  useEffect(() => {
    const fetchClientIntakeTemplates = async () => {
      const templates = await getAllPartyIntakeTemplates();
      setCurrentClientIntakeTemplates(templates);
    };
    fetchClientIntakeTemplates();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* <Card className="w-full border-none shadow-lg">
        <CardContent className="p-6 min-h-[400px] flex flex-col"> */}
      <div className="flex flex-col flex-grow">
        {/* Two cards: each fills 50% of the width (minus the gap) */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Client Intake Form Card */}
          <div className="relative">
            <div
              onClick={() =>
                setEditFormType(
                  editFormType === "client_intake" ? null : "client_intake"
                )
              }
              className={`
                    h-48 py-8 px-6
                    flex flex-col items-center justify-center 
                    rounded-xl cursor-pointer transition
                    ${
                      editFormType === "client_intake"
                        ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-xl"
                        : "border border-gray-200 hover:border-green-400 hover:bg-green-50"
                    }
                  `}
            >
              <DocumentTextIcon
                className={`h-12 w-12 transition ${
                  editFormType === "client_intake"
                    ? "text-white"
                    : "text-green-600"
                }`}
              />
              <p
                className={`mt-4 text-lg font-semibold ${
                  editFormType === "client_intake"
                    ? "text-white"
                    : "text-gray-900"
                } text-center`}
              >
                Client Intake Form
              </p>
            </div>
          </div>

          {/* Transaction Forms Card */}
          <div className="relative">
            <div
              onClick={() =>
                setEditFormType(
                  editFormType === "transaction_forms" ? null : "transaction_forms"
                )
              }
              className={`
                    h-48 py-8 px-6
                    flex flex-col items-center justify-center 
                    rounded-xl cursor-pointer transition
                    ${
                      editFormType === "transaction_forms"
                        ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-xl"
                        : "border border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                    }
                  `}
            >
              <ClipboardDocumentListIcon
                className={`h-12 w-12 transition ${
                  editFormType === "transaction_forms"
                    ? "text-white"
                    : "text-blue-600"
                }`}
              />
              <p
                className={`mt-4 text-lg font-semibold ${
                  editFormType === "transaction_forms"
                    ? "text-white"
                    : "text-gray-900"
                } text-center`}
              >
                Transaction Forms
              </p>
            </div>
          </div>
        </div>

        {/* If a form‐card is selected, show the three linked dropdowns */}
        {editFormType && (
          <div className="mt-4 flex flex-col items-center">
            <label className="mb-4 text-sm font-medium text-gray-700">
              {editFormType === "client_intake"
                ? "Filter Client Intake Templates:"
                : "Filter Transaction Templates:"}
            </label>

            <div className="flex items-center space-x-6">
              {/* First dropdown: buy, sell, rent, lease */}
              <Select
                onValueChange={(val) => {
                  setFirstFilter(val);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Deal Side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deal Sides</SelectItem>
                  <SelectItem value="buy">buy</SelectItem>
                  <SelectItem value="sell">sell</SelectItem>
                  <SelectItem value="rent">rent</SelectItem>
                  <SelectItem value="lease">lease</SelectItem>
                </SelectContent>
              </Select>

              {/* Second dropdown: residential, commercial, improved_land, unimproved_land */}
              <Select
                onValueChange={(val) => {
                  setSecondFilter(val);
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Property Types</SelectItem>
                  <SelectItem value="residential">residential</SelectItem>
                  <SelectItem value="commercial">commercial</SelectItem>
                  <SelectItem value="improved_land">improved_land</SelectItem>
                  <SelectItem value="unimproved_land">
                    unimproved_land
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Cards Grid */}
            <div className="w-full mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editFormType === "client_intake"
                  ? "Client Intake Templates"
                  : "Transaction Form Templates"}
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {(editFormType === "client_intake"
                  ? currentClientIntakeTemplates
                  : currentTemplates
                )
                  .filter((template: Template | ClientIntakeTemplate) => {
                    const templateParts = template.name.split("-");
                    const templateDealSide = templateParts[0];
                    const templatePropertyType = templateParts[1];

                    const matchesDealSide =
                      !firstFilter ||
                      firstFilter === "all" ||
                      templateDealSide === firstFilter;
                    const matchesPropertyType =
                      !secondFilter ||
                      secondFilter === "all" ||
                      templatePropertyType === secondFilter;

                    return matchesDealSide && matchesPropertyType;
                  })
                  .map((template: Template | ClientIntakeTemplate) => (
                    <div key={template.id} className="relative">
                      <div
                        onClick={() => {
                          if (editFormType === "transaction_forms") {
                            router.push(
                              `/realtor/workspace/templates/modify/transaction-form/${template.id}`
                            );
                          } else if (editFormType === "client_intake") {
                            router.push(
                              `/realtor/workspace/templates/modify/client-intake/${template.id}`
                            );
                          }
                        }}
                        className={`h-32 flex flex-col items-center justify-center rounded-lg cursor-pointer transition border border-gray-200 ${
                          editFormType === "transaction_forms"
                            ? "hover:border-blue-400 hover:bg-blue-50"
                            : "hover:border-green-400 hover:bg-green-50"
                        }`}
                      >
                        {/* Icon */}
                        {template.name.includes("residential") ? (
                          <DocumentTextIcon
                            className={`h-7 w-7 transition ${
                              editFormType === "transaction_forms"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          />
                        ) : template.name.includes("commercial") ? (
                          <Building
                            className={`h-7 w-7 transition ${
                              editFormType === "transaction_forms"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          />
                        ) : template.name.includes("unimproved_land") ? (
                          <Map
                            className={`h-7 w-7 transition ${
                              editFormType === "transaction_forms"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          />
                        ) : (
                          <Landmark
                            className={`h-7 w-7 transition ${
                              editFormType === "transaction_forms"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          />
                        )}

                        {/* Template Name */}
                        <p className="mt-2 text-sm font-semibold text-gray-900 text-center px-2">
                          {template.name
                            ? (() => {
                                const parts = template.name.split("-");
                                if (parts.length < 3)
                                  return "Invalid Template Name";
                                return (
                                  (parts[0]?.charAt(0)?.toUpperCase() || "") +
                                  (parts[0]?.slice(1) || "") +
                                  " " +
                                  (parts[1]?.charAt(0)?.toUpperCase() || "") +
                                  (parts[1]?.slice(1) || "") +
                                  " " +
                                  (parts[2] || "")
                                ).replaceAll("_", " ");
                              })()
                            : "Unnamed Template"}
                        </p>

                        {/* Description */}
                        <p className="mt-1 text-xs text-gray-600 text-center">
                          Click to edit
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* </CardContent>
      </Card> */}
    </div>
  );
};

export default GamifiedTemplateModification;
