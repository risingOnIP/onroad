import React from 'react';
import { SchemaItem } from '../../types/realtor';
import TextField from './TextField';
import DatePickerField from './DatePickerField';
import MonthYearField from './MonthYearField';
import CheckboxField from './CheckboxField';
import RadioField from './RadioField';
import InfoField from './InfoField';
import SignatureField from './SignatureField';
import FileUploadField from './FileUploadField';

interface PartyOption {
  id: string;
  type: "deal_party" | "deal_option_party";
  label: string;
  email: string;
  role?: string;
}

interface FieldRendererProps {
  schemaItem: SchemaItem;
  value: any;
  onChange: (value: any) => void;
  onBlur: (value: any) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
  formResponses?: Record<string, any>;
  onLinkedFieldChange?: (fieldId: string, value: string) => void;
  onLinkedFieldBlur?: (fieldId: string, value: string) => void;
  partyOptions?: PartyOption[];
  onPartySelection?: (item: SchemaItem, partyId: string) => void;
  onSignatureClear?: (item: SchemaItem) => void;
  loadingParties?: boolean;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onAddPartyClick?: () => void;
  allSchemaItems?: SchemaItem[];
}

const FieldRenderer = React.memo<FieldRendererProps>(({
  schemaItem,
  value,
  onChange,
  onBlur,
  disabled = false,
  shouldDisableForClientIntake = false,
  formResponses = {},
  onLinkedFieldChange,
  onLinkedFieldBlur,
  partyOptions = [],
  onPartySelection,
  onSignatureClear,
  loadingParties = false,
  dealId,
  dealOptionId,
  dealSide,
  dealOptionName,
  onAddPartyClick,
  allSchemaItems = []
}) => {
  const { input_type, special_input } = schemaItem.display_attributes;

  // Text and Text Area fields


if (input_type === 'text' || input_type === 'text-area') {
    // Check if it's a month/year field
    if (schemaItem.display_attributes.special_input?.text?.month_year) {
      return (
        <MonthYearField
          schema={schemaItem}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          shouldDisableForClientIntake={shouldDisableForClientIntake}
        />
      );
    }
    
    // Check if it's a date field
    if (schemaItem.display_attributes.special_input?.text?.date || 
        schemaItem.display_attributes.special_input?.text?.numbered_date) {
      return (
        <DatePickerField
          schema={schemaItem}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          shouldDisableForClientIntake={shouldDisableForClientIntake}
        />
      );
    }
    
    // TextField now handles phone fields with country code dropdown internally
    return (
      <TextField
        schema={schemaItem}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        shouldDisableForClientIntake={shouldDisableForClientIntake}
      />
    );
  }

  // Checkbox and Radio fields
  if (input_type === 'checkbox') {
    return (
      <CheckboxField
        schema={schemaItem}
        value={value || []}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        shouldDisableForClientIntake={shouldDisableForClientIntake}
        formResponses={formResponses}
        onLinkedFieldChange={onLinkedFieldChange}
        onLinkedFieldBlur={onLinkedFieldBlur}
        allSchemaItems={allSchemaItems}
      />
    );
  }

  if (input_type === 'radio') {
    return (
      <RadioField
        schema={schemaItem}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        shouldDisableForClientIntake={shouldDisableForClientIntake}
      />
      // <div>hi</div>
    );
  }
 

  // Info fields
  if (input_type === 'info') {
    return <InfoField schema={schemaItem} />;
  }

  // Signature fields
  if (input_type === 'signature') {
    return (
      <SignatureField
        schema={schemaItem}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        shouldDisableForClientIntake={shouldDisableForClientIntake}
        partyOptions={partyOptions}
        onPartySelection={onPartySelection}
        onSignatureClear={onSignatureClear!}
        loadingParties={loadingParties}
        dealId={dealId}
        dealOptionId={dealOptionId}
        dealSide={dealSide}
        dealOptionName={dealOptionName}
        onAddPartyClick={onAddPartyClick}
      />
    );
  }

  // File upload fields
  if (input_type === 'fileUpload') {
    return (
      <FileUploadField
        schema={schemaItem}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        shouldDisableForClientIntake={shouldDisableForClientIntake}
      />
    );
  }


  // Fallback for unsupported field types
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <p className="text-yellow-800 text-sm">
        Field type "{input_type}" not yet supported in optimized renderer
      </p>
      <p className="text-yellow-600 text-xs mt-1">
        Field ID: {schemaItem.unique_id}
      </p>
    </div>
  );
});

FieldRenderer.displayName = 'FieldRenderer';

export default FieldRenderer;