import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface CellOption {
  id: string;
  row: string;
  column: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface TemplateSelectionPageProps {
  rowLabels: readonly string[];
  columnLabels: readonly string[];
  cellOptions: readonly CellOption[];
  setSelectedTemplateType: (type: string) => void;
  selectedTemplateType: string | null;
  onContinue: () => void;
}

const TemplateSelectionPage: React.FC<TemplateSelectionPageProps> = ({
  rowLabels,
  columnLabels,
  cellOptions,
  setSelectedTemplateType,
  selectedTemplateType,
  onContinue,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = () => {
    setIsSubmitting(true);
    onContinue();
    // Optionally, setIsSubmitting(false) if you want to re-enable after async
  };

  return (
    <>
      <div className="grid grid-cols-5 gap-4 flex-grow">
        {/* Top‐left blank cell */}
        <div className="h-10"></div>

        {/* Column headers */}
        {columnLabels.map((colLabel) => (
          <div
            key={colLabel}
            className="flex items-center justify-center h-10 border-b border-gray-200"
          >
            <span className="text-sm font-medium text-gray-700">
              {colLabel}
            </span>
          </div>
        ))}

        {/* Each ROW: first cell is row label, then 4 CELLS */}
        {rowLabels.map((rowLabel) => (
          <React.Fragment key={rowLabel}>
            {/* Row header */}
            <div className="flex items-center justify-center font-medium text-gray-700 border-r border-gray-200">
              {rowLabel}
            </div>

            {/* Four intersection CELLS for this row */}
            {columnLabels.map((colLabel) => {
              const cell = cellOptions.find(
                (opt) => opt.row === rowLabel && opt.column === colLabel
              )!;
              const isSelected = selectedTemplateType === cell.id;
              const { Icon } = cell;

              return (
                <div key={cell.id} className="relative">
                  <div
                    onClick={() => {
                      setSelectedTemplateType(cell.id);
                      setTimeout(() => {
                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: "smooth",
                        });
                      }, 0);
                    }}
                    className={`
                      h-32 
                      flex flex-col items-center justify-center 
                      rounded-lg cursor-pointer transition
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl"
                          : "border border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                      }
                    `}
                  >
                    {/* Icon */}
                    <Icon
                      className={`h-7 w-7 transition ${
                        isSelected ? "text-white" : "text-purple-600"
                      }`}
                    />

                    {/* Title */}
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        isSelected ? "text-white" : "text-gray-900"
                      } text-center`}
                    >
                      {cell.title}
                    </p>

                    {/* Description */}
                    <p
                      className={`mt-1 text-xs ${
                        isSelected ? "text-purple-100" : "text-gray-600"
                      } text-center`}
                    >
                      {cell.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          disabled={!selectedTemplateType || isSubmitting}
          className={`
            ${
              selectedTemplateType
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                : "bg-gray-200 cursor-not-allowed"
            }
            text-white
          `}
          onClick={handleContinue}
        >
          Continue to Naming &rarr;
        </Button>
      </div>
    </>
  );
};

export default TemplateSelectionPage;
