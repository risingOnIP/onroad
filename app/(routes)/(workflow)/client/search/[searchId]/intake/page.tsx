"use client";

import {
  fetchClientIntakeFormResponses,
  fetchRealtorIntakeSchema,
  updateClientIntakeForm,
} from "@/app/actions/client/intake-actions";
import OptimizedFormInput from "@/components/files/realtor/OptimizedFormInput";
import {
  Schema,
  SignatureInput,
  FormResponse,
} from "@/components/files/types/realtor";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const ClientIntakeFormPage = () => {
  const [realtorIntakeSchema, setRealtorIntakeSchema] = useState<Schema>([]);
  const [formResponses, setFormResponses] = useState<FormResponse>({});
  const [isLoading, setIsLoading] = useState(true);
  const pathName = usePathname();
  const segments = pathName.split("/").filter(Boolean);
  const searchId = segments[segments.indexOf("search") + 1];

  useEffect(() => {
    const fetchSchema = async () => {
      // Fetch the schema from the server or any other source
      const fetchedSchema: Schema = await fetchRealtorIntakeSchema(searchId);
      setRealtorIntakeSchema(fetchedSchema);
    };

    fetchSchema();
  }, [searchId]);

  useEffect(() => {
    const fetchResponses = async () => {
      setIsLoading(true);
      try {
        const responses = await fetchClientIntakeFormResponses(searchId);
        setFormResponses(responses);
      } catch (error) {
        console.error("Error fetching form responses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponses();
  }, [searchId]);

  const handleFormResponseUpdateByField = async (
    itemKey: string,
    newValue: string | string[] | SignatureInput
  ) => {
    // Handle form response update logic here

    if (
      typeof newValue === "object" &&
      newValue !== null &&
      "signature" in newValue
    ) {
      //checks if newValue is a SignatureInput
      throw new Error("SignatureInput is not allowed");
    }
    const stringValue = newValue as string;

    await updateClientIntakeForm(searchId, itemKey, stringValue);
    setFormResponses((prev) => ({
      ...prev,
      [itemKey]: stringValue,
    }));
  };

  return (
    <>
      <div>ClientIntakeFormPage</div>
      <OptimizedFormInput
        dealOptionId={searchId}
        schema={realtorIntakeSchema}
        formResponseUpdateByField={handleFormResponseUpdateByField}
        initialFormResponses={formResponses}
        can_edit={true}
        loading={isLoading}
      />
    </>
  );
};

export default ClientIntakeFormPage;
