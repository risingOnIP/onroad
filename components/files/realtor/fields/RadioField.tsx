import React, { useCallback } from 'react';
import clsx from 'clsx';
import { SchemaItem } from '../../types/realtor';

interface RadioFieldProps {
  schema: SchemaItem;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const RadioField = React.memo<RadioFieldProps>(({
  schema,
  value,
  onChange,
  onBlur,
  disabled = false,
  shouldDisableForClientIntake = false,
}) => {
  const { display_radio_options, special_input } = schema.display_attributes;

  // Derive options
  let radioOptions: {radioField: string, displayName: string}[] = display_radio_options?.map(opt => ({radioField: opt, displayName: opt})) || [];
  if ((!radioOptions || radioOptions.length === 0) && schema.pdf_attributes?.length) {
    const pdfAttr = schema.pdf_attributes[0];
    if (pdfAttr.linked_form_fields_radio) {
      radioOptions = pdfAttr.linked_form_fields_radio;
    }
  }

  if (!radioOptions?.length) {
    return <div className="text-sm text-gray-500">No radio options available</div>;
  }

  const layout = special_input?.radio?.layout || 'vertical';
  const columns = Math.min(special_input?.radio?.columns || 2, 4);

  const handleChange = useCallback((optionValue: {radioField: string, displayName: string}) => {
    onChange(optionValue.radioField);
    onBlur(optionValue.radioField);
  }, [onChange, onBlur]);

  const getContainerClass = () => {
    if (layout === 'horizontal') {
      return 'flex flex-wrap gap-x-6 gap-y-3';
    }
    if (layout === 'grid') {
      switch (columns) {
        case 1: return 'grid grid-cols-1 gap-3';
        case 2: return 'grid grid-cols-2 gap-3';
        case 3: return 'grid grid-cols-3 gap-3';
        case 4: return 'grid grid-cols-4 gap-3';
        default: return 'grid grid-cols-2 gap-3';
      }
    }
    return 'flex flex-col gap-3';
  };

  return (
    <div
      role="radiogroup"
      className={getContainerClass()}
    >
      {radioOptions.map((option) => {
        const id = `${schema.unique_id}-${String(option).replace(/\s+/g, '-')}`;
        const isChecked = value === option.radioField;
        const isDisabled = disabled || shouldDisableForClientIntake;

        return (
          <div
            key={option.radioField}
            onClick={() => !isDisabled && handleChange(option)}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all select-none',
              'hover:bg-gray-50',
              isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white',
              isDisabled && 'opacity-50 cursor-not-allowed hover:bg-white',
              shouldDisableForClientIntake && isChecked && 'border-blue-300 bg-blue-100'
            )}
            role="radio"
            aria-checked={isChecked}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
          >
            <span
              className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0',
                isChecked
                  ? (shouldDisableForClientIntake ? 'bg-blue-400 border-blue-400' : 'bg-blue-500 border-blue-500')
                  : 'bg-white border-2 border-gray-300'
              )}
              aria-hidden="true"
            >
              {isChecked && <span className="w-2 h-2 bg-white rounded-full" />}
            </span>

            <span className={clsx(
              'text-sm font-medium',
              isChecked ? (shouldDisableForClientIntake ? 'text-blue-700' : 'text-blue-900') : 'text-gray-700'
            )}>
              {option.displayName}
            </span> 
          </div>
        );
      })
    }
    </div>
  );
});

RadioField.displayName = 'RadioField';
export default RadioField;
