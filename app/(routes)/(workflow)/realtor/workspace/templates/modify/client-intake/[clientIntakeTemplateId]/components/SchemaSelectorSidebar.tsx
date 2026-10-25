"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UsersIcon, 
  UserIcon, 
  HomeIcon, 
  BuildingOfficeIcon 
} from "@heroicons/react/24/outline";
import { SchemaType } from "@/app/actions/realtor/client-intake-template-actions";

interface SchemaSelectorSidebarProps {
  selectedSchemaType: SchemaType;
  onSchemaTypeChange: (schemaType: SchemaType) => void;
  hasUnsavedChanges: boolean;
}

interface SchemaOption {
  type: SchemaType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const schemaOptions: SchemaOption[] = [
  {
    type: 'buyer1_schema',
    label: 'Primary Buyer',
    description: 'Main buyer information',
    icon: UserIcon,
  },
  {
    type: 'buyer2_schema',
    label: 'Secondary Buyer',
    description: 'Additional buyer information',
    icon: UsersIcon,
  },
  {
    type: 'seller1_schema',
    label: 'Primary Seller',
    description: 'Main seller information',
    icon: HomeIcon,
  },
  {
    type: 'seller2_schema',
    label: 'Secondary Seller',
    description: 'Additional seller information',
    icon: BuildingOfficeIcon,
  },
];

export const SchemaSelectorSidebar: React.FC<SchemaSelectorSidebarProps> = ({
  selectedSchemaType,
  onSchemaTypeChange,
  hasUnsavedChanges,
}) => {
  return (
    <Card className="h-fit shadow-sm border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Schema Types
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose which schema to edit
        </p>
        {hasUnsavedChanges && (
          <Badge variant="destructive" className="text-xs w-fit mt-2">
            Unsaved Changes
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {schemaOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedSchemaType === option.type;
          
          return (
            <Button
              key={option.type}
              variant={isSelected ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-4 transition-all duration-200 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-sm border-primary' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => onSchemaTypeChange(option.type)}
            >
              <div className="flex items-start gap-3 text-left w-full">
                <IconComponent 
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    isSelected ? 'text-primary-foreground' : 'text-gray-600'
                  }`} 
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className={`font-medium text-sm mb-1 ${
                    isSelected ? 'text-primary-foreground' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-xs leading-relaxed break-words ${
                    isSelected ? 'text-primary-foreground/80' : 'text-gray-600'
                  }`}>
                    {option.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}; 