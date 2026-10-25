"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PropertyInformationRedirect() {
  const params = useParams<{ deal: string; dealOptionId: string }>();
  const router = useRouter();
  const dealId = params?.deal;
  const dealOptionId = params?.dealOptionId;

  useEffect(() => {
    if (dealId && dealOptionId) {
      // Redirect to the forms section with the property selected
      const newUrl = `/realtor/workspace/${dealId}?tab=forms&propertyId=${dealOptionId}`;
      router.replace(newUrl);
    } else if (dealId) {
      // Redirect to forms section
      const newUrl = `/realtor/workspace/${dealId}?tab=forms`;
      router.replace(newUrl);
    }
  }, [dealId, dealOptionId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg">Redirecting to property information...</div>
    </div>
  );
}