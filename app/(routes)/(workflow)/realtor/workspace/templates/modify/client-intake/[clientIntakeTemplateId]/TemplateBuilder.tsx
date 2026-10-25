"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  HomeIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  BanknotesIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

interface Template {
  id: string;
  type: string;
  name: string;
  description: string;
  fields: Array<{ id: string; type: string }>;
}

interface FormField {
  id: string;
  type: string;
}

const TemplateBuilder = () => {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedTemplateType, setSelectedTemplateType] = useState<
    string | null
  >(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Sample templates data
  const existingTemplates: Template[] = [
    {
      id: "tpl_001",
      type: "buy-residential",
      name: "Standard Residential Purchase Agreement",
      description: "Used for all single-family home purchases.",
      fields: [
        { id: "field_1630425600000", type: "address" },
        { id: "field_1630425601000", type: "price" },
        { id: "field_1630425602000", type: "date" },
      ],
    },
    {
      id: "tpl_002",
      type: "lease-commercial",
      name: "Commercial Lease Agreement Template",
      description: "Standard lease for commercial properties.",
      fields: [
        { id: "field_1630425610000", type: "address" },
        { id: "field_1630425611000", type: "price" },
        { id: "field_1630425612000", type: "signature" },
      ],
    },
  ];

  const templateTypes = [
    {
      type: "buy-residential",
      icon: HomeIcon,
      title: "Buy Residential",
      description: "Single family homes, condos, townhouses",
    },
    {
      type: "buy-commercial",
      icon: BuildingOfficeIcon,
      title: "Buy Commercial",
      description: "Office buildings, retail spaces, warehouses",
    },
    {
      type: "buy-improved",
      icon: BuildingStorefrontIcon,
      title: "Buy Improved Land",
      description: "Developed lots with utilities and infrastructure",
    },
    {
      type: "buy-unimproved",
      icon: BuildingOffice2Icon,
      title: "Buy Raw Land",
      description: "Undeveloped parcels and vacant lots",
    },
    {
      type: "sell-residential",
      icon: HomeModernIcon,
      title: "Sell Residential",
      description: "List and sell residential properties",
    },
    {
      type: "sell-commercial",
      icon: BuildingLibraryIcon,
      title: "Sell Commercial",
      description: "Market commercial real estate",
    },
    {
      type: "sell-improved",
      icon: BuildingOffice2Icon,
      title: "Sell Improved Land",
      description: "Developed land ready for construction",
    },
    {
      type: "sell-unimproved",
      icon: BuildingOffice2Icon,
      title: "Sell Raw Land",
      description: "Undeveloped property sales",
    },
  ];

  const handleModeChange = (newMode: "create" | "edit") => {
    setMode(newMode);
    setSelectedTemplateType(null);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (type: string) => {
    setSelectedTemplateType(type);
  };

  const handleTemplateEdit = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedTemplateType(template.type);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setFormFields(template.fields);
  };

  const handleContinue = () => {
    if (selectedTemplateType || selectedTemplate) {
      setCurrentPage(2);
    }
  };

  const handleBack = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleBuildForms = () => {
    if (templateName.trim()) {
      setCurrentPage(3);
    }
  };

  const handleSaveTemplate = () => {
    const templateData = {
      id: selectedTemplate?.id || `new_${Date.now()}`,
      type: selectedTemplateType,
      name: templateName,
      description: templateDescription,
      fields: formFields,
    };

    // TODO: Implement actual save functionality
    alert("Template saved successfully!");
    setCurrentPage(1);
    resetForm();
  };

  const resetForm = () => {
    setMode("create");
    setSelectedTemplateType(null);
    setSelectedTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setFormFields([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg backdrop-blur-lg">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">
            OnRoad Template Builder
          </div>
          <div className="flex gap-2">
            {["Manage Templates", "Name Template", "Build Forms"].map(
              (step, index) => (
                <div key={step} className="flex items-center">
                  <span
                    className={`px-4 py-2 rounded-full text-sm ${
                      index + 1 === currentPage
                        ? "bg-indigo-600 text-white"
                        : index + 1 < currentPage
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {step}
                  </span>
                  {index < 2 && <span className="mx-2 text-gray-400">→</span>}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Page 1: Template Selection */}
      {currentPage === 1 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Your Templates
            </h1>
            <p className="text-gray-600">
              Create a new template or edit an existing one
            </p>
          </div>

          <div className="mb-8">
            <div className="flex gap-4 mb-6">
              <button
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  mode === "create"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleModeChange("create")}
              >
                Create New Template
              </button>
              <button
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  mode === "edit"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleModeChange("edit")}
              >
                Edit Existing Template
              </button>
            </div>

            {mode === "edit" && (
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">
                  Select a Template to Edit:
                </label>
                <select
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  onChange={(e) => {
                    const template = existingTemplates.find(
                      (t) => t.id === e.target.value
                    );
                    if (template) handleTemplateEdit(template);
                  }}
                >
                  <option value="">Select a template...</option>
                  {existingTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "create" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templateTypes.map(
                  ({ type, icon: Icon, title, description }) => (
                    <motion.div
                      key={type}
                      className={`p-6 rounded-2xl cursor-pointer transition-all ${
                        selectedTemplateType === type
                          ? "bg-indigo-50 border-2 border-indigo-600"
                          : "bg-white border-2 border-gray-100 hover:border-indigo-600"
                      }`}
                      onClick={() => handleTemplateSelect(type)}
                      whileHover={{ y: -4 }}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                      </h3>
                      <p className="text-gray-600 text-sm">{description}</p>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="flex gap-2">
              {[1, 2, 3].map((page) => (
                <div
                  key={page}
                  className={`w-3 h-3 rounded-full ${
                    page === currentPage
                      ? "bg-indigo-600"
                      : page < currentPage
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedTemplateType || selectedTemplate
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={handleContinue}
              disabled={!selectedTemplateType && !selectedTemplate}
            >
              Continue to Naming →
            </button>
          </div>
        </div>
      )}

      {/* Page 2: Template Naming */}
      {currentPage === 2 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Name Your Template
            </h1>
            <p className="text-gray-600">
              Give your template a memorable name and description
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-600 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  {selectedTemplateType?.startsWith("buy") ? (
                    <HomeIcon className="w-6 h-6 text-white" />
                  ) : (
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedTemplateType
                      ?.split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </h3>
                  <p className="text-gray-600">
                    {
                      templateTypes.find((t) => t.type === selectedTemplateType)
                        ?.description
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g., Standard Residential Purchase Agreement"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 h-32"
                  placeholder="Describe when and how this template should be used..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={handleBack}
            >
              ← Back
            </button>
            <div className="flex gap-2">
              {[1, 2, 3].map((page) => (
                <div
                  key={page}
                  className={`w-3 h-3 rounded-full ${
                    page === currentPage
                      ? "bg-indigo-600"
                      : page < currentPage
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleBuildForms}
            >
              Build Forms →
            </button>
          </div>
        </div>
      )}

      {/* Page 3: Form Builder */}
      {currentPage === 3 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Build Your Forms
            </h1>
            <p className="text-gray-600">
              Drag and drop form elements to create or edit your template
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Form Elements Sidebar */}
            <div className="col-span-3 bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Form Elements
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Basic Fields
                  </h4>
                  <div className="space-y-2">
                    {["text", "textarea", "number", "date"].map((type) => (
                      <div
                        key={type}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:border-indigo-600 flex items-center gap-3"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", type);
                        }}
                      >
                        <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                        <span className="text-gray-700">
                          {type.charAt(0).toUpperCase() + type.slice(1)} Input
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Real Estate Specific
                  </h4>
                  <div className="space-y-2">
                    {[
                      { type: "address", icon: HomeIcon },
                      { type: "price", icon: BanknotesIcon },
                      { type: "signature", icon: PencilSquareIcon },
                    ].map(({ type, icon: Icon }) => (
                      <div
                        key={type}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:border-indigo-600 flex items-center gap-3"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", type);
                        }}
                      >
                        <Icon className="w-5 h-5 text-indigo-600" />
                        <span className="text-gray-700">
                          {type.charAt(0).toUpperCase() + type.slice(1)} Field
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Canvas */}
            <div
              className="col-span-9 bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 min-h-[600px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const type = e.dataTransfer.getData("text/plain");
                const newField = {
                  id: `field_${Date.now()}`,
                  type,
                };
                setFormFields([...formFields, newField]);
              }}
            >
              {formFields.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <h3 className="text-lg font-semibold mb-2">
                    Drop form elements here
                  </h3>
                  <p>Drag elements from the left panel to build your form</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formFields.map((field) => (
                    <div
                      key={field.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-600 relative group"
                    >
                      <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          onClick={() => {
                            setFormFields(
                              formFields.filter((f) => f.id !== field.id)
                            );
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <label className="block font-medium text-gray-700 mb-2">
                        {field.type.charAt(0).toUpperCase() +
                          field.type.slice(1)}{" "}
                        Field
                      </label>
                      {field.type === "text" && (
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter text..."
                        />
                      )}
                      {field.type === "textarea" && (
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter description..."
                        />
                      )}
                      {field.type === "number" && (
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-300 rounded focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter number..."
                        />
                      )}
                      {field.type === "date" && (
                        <input
                          type="date"
                          className="w-full p-2 border border-gray-300 rounded focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                      )}
                      {field.type === "address" && (
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Property address..."
                        />
                      )}
                      {field.type === "price" && (
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          placeholder="$0.00"
                        />
                      )}
                      {field.type === "signature" && (
                        <div className="h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                          Signature Area
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={handleBack}
            >
              ← Back
            </button>
            <div className="flex gap-2">
              {[1, 2, 3].map((page) => (
                <div
                  key={page}
                  className={`w-3 h-3 rounded-full ${
                    page === currentPage
                      ? "bg-indigo-600"
                      : page < currentPage
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleSaveTemplate}
            >
              Save Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder;
