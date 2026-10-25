import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertySectionProps {
  propertyInfo: any;
  isEditing: boolean;
  handleChange: (key: string, value: string) => void;
}

export const PhysicalCharacteristics: React.FC<PropertySectionProps> = ({
  propertyInfo,
  isEditing,
  handleChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Physical Characteristics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year_built">Year Built</Label>
          <Input
            id="year_built"
            type="number"
            value={propertyInfo.year_built}
            onChange={(e) => handleChange("year_built", e.target.value)}
            disabled={!isEditing}
            placeholder="2020"
          />
        </div>
        
        <div>
          <Label htmlFor="building_square_footage">Building Square Footage</Label>
          <Input
            id="building_square_footage"
            value={propertyInfo.building_square_footage}
            onChange={(e) => handleChange("building_square_footage", e.target.value)}
            disabled={!isEditing}
            placeholder="2,500 sq ft"
          />
        </div>
        
        <div>
          <Label htmlFor="finished_basement">Finished Basement</Label>
          <Select
            value={propertyInfo.finished_basement}
            onValueChange={(value) => handleChange("finished_basement", value)}
            disabled={!isEditing}
          >
            <SelectTrigger id="finished_basement">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="partial">Partially Finished</SelectItem>
              <SelectItem value="na">N/A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="lot_dimensions">Lot Dimensions</Label>
          <Input
            id="lot_dimensions"
            value={propertyInfo.lot_dimensions}
            onChange={(e) => handleChange("lot_dimensions", e.target.value)}
            disabled={!isEditing}
            placeholder="100x150 ft"
          />
        </div>
        
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            value={propertyInfo.bedrooms}
            onChange={(e) => handleChange("bedrooms", e.target.value)}
            disabled={!isEditing}
            placeholder="3"
          />
        </div>
        
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            value={propertyInfo.bathrooms}
            onChange={(e) => handleChange("bathrooms", e.target.value)}
            disabled={!isEditing}
            placeholder="2.5"
          />
        </div>
        
        <div>
          <Label htmlFor="construction_type">Construction Type</Label>
          <Select
            value={propertyInfo.construction_type}
            onValueChange={(value) => handleChange("construction_type", value)}
            disabled={!isEditing}
          >
            <SelectTrigger id="construction_type">
              <SelectValue placeholder="Select construction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wood_frame">Wood Frame</SelectItem>
              <SelectItem value="brick">Brick</SelectItem>
              <SelectItem value="concrete_block">Concrete Block</SelectItem>
              <SelectItem value="steel_frame">Steel Frame</SelectItem>
              <SelectItem value="stucco">Stucco</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="roof_foundation_type">Roof & Foundation Type</Label>
          <Input
            id="roof_foundation_type"
            value={propertyInfo.roof_foundation_type}
            onChange={(e) => handleChange("roof_foundation_type", e.target.value)}
            disabled={!isEditing}
            placeholder="Shingle roof, Slab foundation"
          />
        </div>
        
        <div>
          <Label htmlFor="architectural_style">Architectural Style</Label>
          <Select
            value={propertyInfo.architectural_style}
            onValueChange={(value) => handleChange("architectural_style", value)}
            disabled={!isEditing}
          >
            <SelectTrigger id="architectural_style">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contemporary">Contemporary</SelectItem>
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="ranch">Ranch</SelectItem>
              <SelectItem value="colonial">Colonial</SelectItem>
              <SelectItem value="victorian">Victorian</SelectItem>
              <SelectItem value="mediterranean">Mediterranean</SelectItem>
              <SelectItem value="craftsman">Craftsman</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};