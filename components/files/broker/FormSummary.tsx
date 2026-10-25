'use client';

import React from 'react';

interface FormSummaryProps {
  formType: string;
  formResponse: any;
  propertyAddress?: string;
}

export function FormSummary({ formType, formResponse, propertyAddress }: FormSummaryProps) {
  // Helper function to format dates
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      // Handle MM/DD/YYYY format
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Handle ISO format
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: string | number): string => {
    if (!amount) return '';
    const numAmount = typeof amount === 'string' ? 
      parseFloat(amount.replace(/[^0-9.-]+/g, '')) : 
      amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Helper component for highlighted values
  const HighlightedValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="font-semibold text-blue-600 underline decoration-blue-300 underline-offset-2">
      {children}
    </span>
  );

  // Generate summary based on form type
  const generateSummary = () => {
    if (!formResponse) {
      return <p className="text-muted-foreground">No form data available</p>;
    }

    const lowerFormType = formType?.toLowerCase().replace(/_/g, ' ');

    // Residential Lease Agreement
    if (lowerFormType?.includes('residential lease') || lowerFormType?.includes('lease agreement')) {
      const parts: React.ReactNode[] = [];
      
      // Opening statement with property address
      if (formResponse.property_street_address || propertyAddress) {
        parts.push(
          <span key="intro">
            This residential lease agreement for{' '}
            <HighlightedValue>
              {formResponse.property_street_address || propertyAddress}
            </HighlightedValue>
          </span>
        );
      } else {
        parts.push(<span key="intro">This residential lease agreement</span>);
      }

      // Lease dates
      if (formResponse.lease_start_date && formResponse.lease_end_date) {
        parts.push(
          <span key="dates">
            {' '}begins on{' '}
            <HighlightedValue>{formatDate(formResponse.lease_start_date)}</HighlightedValue>
            {' '}and ends on{' '}
            <HighlightedValue>{formatDate(formResponse.lease_end_date)}</HighlightedValue>
          </span>
        );
      } else if (formResponse.lease_start_date) {
        parts.push(
          <span key="start-date">
            {' '}begins on{' '}
            <HighlightedValue>{formatDate(formResponse.lease_start_date)}</HighlightedValue>
          </span>
        );
      }

      // Monthly rent
      if (formResponse.monthly_rent_amount) {
        parts.push(
          <span key="rent">
            . The monthly rent is{' '}
            <HighlightedValue>
              {formatCurrency(formResponse.monthly_rent_amount)}
            </HighlightedValue>
          </span>
        );
      }

      // Due date
      if (formResponse.monthly_rent_due_date?.includes('first_day')) {
        parts.push(
          <span key="due-date">
            {' '}due on the <HighlightedValue>first day of each month</HighlightedValue>
          </span>
        );
      }

      // Tenant and landlord names
      const tenantNames = formResponse.tenant_names || formResponse.tenant_name;
      const landlordName = formResponse.landlord_name || formResponse.landlord_names;
      
      if (tenantNames || landlordName) {
        parts.push(<span key="parties">. </span>);
        
        if (tenantNames) {
          parts.push(
            <span key="tenant">
              The tenant{tenantNames.includes(',') || tenantNames.includes('and') ? 's are' : ' is'}{' '}
              <HighlightedValue>{tenantNames}</HighlightedValue>
            </span>
          );
        }
        
        if (tenantNames && landlordName) {
          parts.push(<span key="and"> and </span>);
        }
        
        if (landlordName) {
          parts.push(
            <span key="landlord">
              {!tenantNames ? 'The ' : ''}landlord{landlordName.includes(',') || landlordName.includes('and') ? 's are' : ' is'}{' '}
              <HighlightedValue>{landlordName}</HighlightedValue>
            </span>
          );
        }
      }

      // Security deposit
      if (formResponse.security_deposit_amount) {
        parts.push(
          <span key="deposit">
            . A security deposit of{' '}
            <HighlightedValue>
              {formatCurrency(formResponse.security_deposit_amount)}
            </HighlightedValue>
            {' '}is required
          </span>
        );
      }

      // Auto-renewal
      if (formResponse.auto_renewal_term_checkbox?.includes('auto_renewal')) {
        parts.push(
          <span key="renewal">
            . The lease includes an{' '}
            <HighlightedValue>automatic renewal clause</HighlightedValue>
          </span>
        );
      }

      parts.push(<span key="end">.</span>);
      return <p className="text-sm leading-relaxed">{parts}</p>;
    }

    // Purchase Agreement
    if (lowerFormType?.includes('purchase agreement')) {
      const parts: React.ReactNode[] = [];
      
      parts.push(<span key="intro">This purchase agreement</span>);
      
      if (propertyAddress) {
        parts.push(
          <span key="address">
            {' '}for <HighlightedValue>{propertyAddress}</HighlightedValue>
          </span>
        );
      }
      
      if (formResponse.price || formResponse.purchase_price) {
        parts.push(
          <span key="price">
            {' '}has a purchase price of{' '}
            <HighlightedValue>
              {formatCurrency(formResponse.price || formResponse.purchase_price)}
            </HighlightedValue>
          </span>
        );
      }
      
      if (formResponse.buyer_name || formResponse.buyer_names) {
        const buyerName = formResponse.buyer_name || formResponse.buyer_names;
        parts.push(
          <span key="buyer">
            . The buyer{buyerName.includes(',') || buyerName.includes('and') ? 's are' : ' is'}{' '}
            <HighlightedValue>{buyerName}</HighlightedValue>
          </span>
        );
      }

      if (formResponse.seller_name || formResponse.seller_names) {
        const sellerName = formResponse.seller_name || formResponse.seller_names;
        parts.push(
          <span key="seller">
            {formResponse.buyer_name ? ' and the' : '. The'} seller{sellerName.includes(',') || sellerName.includes('and') ? 's are' : ' is'}{' '}
            <HighlightedValue>{sellerName}</HighlightedValue>
          </span>
        );
      }

      if (formResponse.closing_date) {
        parts.push(
          <span key="closing">
            . Closing is scheduled for{' '}
            <HighlightedValue>{formatDate(formResponse.closing_date)}</HighlightedValue>
          </span>
        );
      }

      parts.push(<span key="end">.</span>);
      return <p className="text-sm leading-relaxed">{parts}</p>;
    }

    // Disclosure Form
    if (lowerFormType?.includes('disclosure')) {
      const parts: React.ReactNode[] = [];
      
      parts.push(<span key="intro">This disclosure form</span>);
      
      if (formResponse.disclosed === 'yes' || formResponse.disclosed === true) {
        parts.push(
          <span key="status">
            {' '}indicates that <HighlightedValue>all required disclosures have been made</HighlightedValue>
          </span>
        );
      } else if (formResponse.disclosed === 'no' || formResponse.disclosed === false) {
        parts.push(
          <span key="status">
            {' '}indicates <HighlightedValue>pending disclosures</HighlightedValue>
          </span>
        );
      }
      
      if (formResponse.details) {
        parts.push(
          <span key="details">
            {' '}with the following details: <HighlightedValue>{formResponse.details}</HighlightedValue>
          </span>
        );
      }

      parts.push(<span key="end">.</span>);
      return <p className="text-sm leading-relaxed">{parts}</p>;
    }

    // Inspection Report
    if (lowerFormType?.includes('inspection')) {
      const parts: React.ReactNode[] = [];
      
      parts.push(<span key="intro">Property inspection</span>);
      
      if (formResponse.date || formResponse.inspection_date) {
        parts.push(
          <span key="date">
            {' '}conducted on{' '}
            <HighlightedValue>
              {formatDate(formResponse.date || formResponse.inspection_date)}
            </HighlightedValue>
          </span>
        );
      }
      
      if (formResponse.inspector || formResponse.inspector_name) {
        parts.push(
          <span key="inspector">
            {' '}by <HighlightedValue>{formResponse.inspector || formResponse.inspector_name}</HighlightedValue>
          </span>
        );
      }

      if (formResponse.findings || formResponse.issues || formResponse.summary) {
        parts.push(
          <span key="findings">
            . Key findings: <HighlightedValue>
              {formResponse.findings || formResponse.issues || formResponse.summary}
            </HighlightedValue>
          </span>
        );
      }

      parts.push(<span key="end">.</span>);
      return <p className="text-sm leading-relaxed">{parts}</p>;
    }

    // IABS Form
    if (lowerFormType?.includes('iabs')) {
      const parts: React.ReactNode[] = [];
      
      parts.push(
        <span key="intro">
          Information About Brokerage Services form
        </span>
      );

      if (formResponse.broker_firm_name) {
        parts.push(
          <span key="broker">
            {' '}for <HighlightedValue>{formResponse.broker_firm_name}</HighlightedValue>
          </span>
        );
      }

      if (formResponse.sales_agent_name) {
        parts.push(
          <span key="agent">
            {' '}with agent <HighlightedValue>{formResponse.sales_agent_name}</HighlightedValue>
          </span>
        );
      }

      const hasSellerInitials = formResponse.seller1_initials || formResponse.seller2_initials;
      const hasBuyerInitials = formResponse.buyer1_initials || formResponse.buyer2_initials;

      if (hasSellerInitials || hasBuyerInitials) {
        parts.push(<span key="ack">. Acknowledgment received from </span>);
        
        if (hasSellerInitials) {
          parts.push(<HighlightedValue key="seller">seller</HighlightedValue>);
        }
        
        if (hasSellerInitials && hasBuyerInitials) {
          parts.push(<span key="and"> and </span>);
        }
        
        if (hasBuyerInitials) {
          parts.push(<HighlightedValue key="buyer">buyer</HighlightedValue>);
        }
      }

      parts.push(<span key="end">.</span>);
      return <p className="text-sm leading-relaxed">{parts}</p>;
    }

    // Default fallback - show key fields in a readable format
    const entries = Object.entries(formResponse).filter(
      ([key, value]) => value && 
      !key.includes('signature') && 
      !key.includes('_id') &&
      !key.includes('created_at') &&
      !key.includes('updated_at')
    );

    if (entries.length === 0) {
      return <p className="text-muted-foreground">No significant data in this form</p>;
    }

    const parts: React.ReactNode[] = [];
    parts.push(<span key="intro">This {formType.replace(/_/g, ' ').toLowerCase()} contains: </span>);

    entries.slice(0, 5).forEach(([key, value], index) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const formattedValue = typeof value === 'string' && value.includes('/') 
        ? formatDate(value)
        : typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^0-9.-]+/g, '')))
        ? formatCurrency(value)
        : String(value);

      parts.push(
        <span key={key}>
          {index > 0 && ', '}
          {formattedKey}: <HighlightedValue>{formattedValue}</HighlightedValue>
        </span>
      );
    });

    if (entries.length > 5) {
      parts.push(<span key="more"> and {entries.length - 5} more fields</span>);
    }

    parts.push(<span key="end">.</span>);
    return <p className="text-sm leading-relaxed">{parts}</p>;
  };

  return (
    <div className="space-y-2">
      {generateSummary()}
    </div>
  );
}