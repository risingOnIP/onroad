import React, { useState } from 'react';
import { Info, AlertCircle, CheckCircle, AlertTriangle, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { SchemaItem } from '../../types/realtor';

interface InfoFieldProps {
  schema: SchemaItem;
}

const InfoField = React.memo<InfoFieldProps>(({ schema }) => {
  const { description, display_name, special_input } = schema.display_attributes;
  const [isMinimized, setIsMinimized] = useState(false);
  
  // For info fields, use display_name as the content if description is not provided
  const content = description || display_name;
  
  if (!content) {
    return null;
  }

  const style = special_input?.info?.style || 'default';
  const showIcon = special_input?.info?.icon !== false;
  const minimizable = special_input?.info?.minimizable || false;

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (style) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'tip':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStyleClasses = () => {
    const baseClasses = "rounded-lg border";
    
    switch (style) {
      case 'warning':
        return `${baseClasses} border-yellow-200 bg-yellow-50 text-yellow-800`;
      case 'error':
        return `${baseClasses} border-red-200 bg-red-50 text-red-800`;
      case 'success':
        return `${baseClasses} border-green-200 bg-green-50 text-green-800`;
      case 'tip':
        return `${baseClasses} border-blue-200 bg-blue-50 text-blue-800`;
      case 'subtle':
        return `${baseClasses} border-gray-100 bg-gray-50 text-gray-600`;
      case 'minimal':
        return "text-gray-600";
      case 'inline':
        return "inline text-gray-500 text-sm";
      case 'compact':
        return `${baseClasses} border-gray-200 bg-white text-gray-700 text-sm`;
      default:
        return `${baseClasses} border-blue-200 bg-blue-50 text-blue-800`;
    }
  };

  const getPadding = () => {
    switch (style) {
      case 'minimal':
      case 'inline':
        return '';
      case 'compact':
        return 'p-2';
      default:
        return 'p-4';
    }
  };

  if (style === 'inline' || style === 'minimal') {
    return (
      <div className={clsx(getStyleClasses(), "flex items-start gap-2")}>
        {getIcon()}
        <span>{content}</span>
      </div>
    );
  }

  return (
    <div className={clsx(getStyleClasses(), getPadding())}>
      <div className="flex items-start gap-3">
        {minimizable && (
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex-shrink-0 p-0.5 hover:bg-black/5 rounded"
          >
            {isMinimized ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
        
        {getIcon()}
        
        <div className="flex-1">
          {!isMinimized && (
            <div className="text-sm leading-relaxed">
              {content}
            </div>
          )}
          
          {isMinimized && (
            <div className="text-sm font-medium cursor-pointer" onClick={() => setIsMinimized(false)}>
              {content.length > 50 ? `${content.slice(0, 50)}...` : content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

InfoField.displayName = 'InfoField';

export default InfoField;