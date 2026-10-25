"use server";

import { getAuthToken } from "@/app/actions/general";
import {
  FinancialAssumptions,
  FinancialResults,
  SensitivityConfig,
  SensitivityResults,
} from "@/components/files/realtor/financial/types";

const API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3200/api";

export async function getFinancialModel(dealOptionId: string) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_URL}/realtor/financial/${dealOptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch financial model: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching financial model:", error);
    throw error;
  }
}

export async function saveFinancialModel(
  dealOptionId: string,
  modelData: {
    assumptions?: FinancialAssumptions;
    results?: FinancialResults;
    sensitivityConfig?: SensitivityConfig;
    sensitivityResults?: SensitivityResults;
  }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_URL}/realtor/financial/${dealOptionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modelData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to save financial model: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving financial model:", error);
    throw error;
  }
}

export async function runSensitivityAnalysis(
  dealOptionId: string,
  config: SensitivityConfig
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_URL}/realtor/financial/${dealOptionId}/analyze`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to run sensitivity analysis: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error running sensitivity analysis:", error);
    throw error;
  }
}

export async function exportFinancialModelToExcel(dealOptionId: string) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_URL}/realtor/financial/${dealOptionId}/export`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export financial model: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error exporting financial model:", error);
    throw error;
  }
}