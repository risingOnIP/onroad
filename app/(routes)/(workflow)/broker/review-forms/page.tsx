'use client';

import { Suspense } from 'react';
import ReviewFormsClient from './ReviewFormsClient';

function ReviewFormsContent() {
  return <ReviewFormsClient />;
}

export default function BrokerReviewFormsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    }>
      <ReviewFormsContent />
    </Suspense>
  );
}