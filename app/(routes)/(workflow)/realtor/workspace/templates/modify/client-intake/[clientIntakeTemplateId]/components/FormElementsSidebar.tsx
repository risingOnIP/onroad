import React from "react";
import {
  DocumentTextIcon,
  ListBulletIcon,
  CheckCircleIcon,
  PaperClipIcon,
} from "@heroicons/react/24/solid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const FormElementsSidebar: React.FC = () => {
  const formElements = [
    { type: "text", icon: DocumentTextIcon, label: "Text Input" },
    { type: "radio", icon: ListBulletIcon, label: "Radio Buttons" },
    { type: "checkbox", icon: CheckCircleIcon, label: "Checkbox" },
    { type: "fileUpload", icon: PaperClipIcon, label: "File Upload" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Form Elements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Available Fields
          </div>
          <div className="space-y-2">
            {formElements.map(({ type, icon: Icon, label }) => (
              <div
                key={type}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:border-indigo-600 flex items-center gap-3"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", type);
                }}
              >
                <Icon className="w-5 h-5 text-indigo-600" />
                <span className="text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
