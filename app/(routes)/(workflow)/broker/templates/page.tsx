import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSpreadsheet,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";

const TemplateSelectionPage = () => {
  return (
    <div className="flex h-screen w-full bg-background p-6">
      <div className="w-full max-w-7xl mx-auto">
        <Link
          href="/broker/dashboard"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors w-fit mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="grid grid-cols-3 gap-6 w-full h-[80vh] my-auto">
          {/* Left Card */}
          <Link
            href="/broker/templates/provisions"
            className="group transition-all duration-300 hover:scale-[1.02]"
          >
            <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 border-slate-200 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-4">
              <FileText className="w-12 h-12 text-slate-600 group-hover:text-slate-800 transition-colors" />
              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-semibold text-slate-800">
                  Provisions Templates
                </h3>
                <p className="text-sm text-slate-600">
                  Manage and customize your provision templates
                </p>
              </div>
              <Button
                variant="secondary"
                className="mt-2 group-hover:bg-slate-800 group-hover:text-white transition-colors"
              >
                Open Provisions
              </Button>
            </Card>
          </Link>

          {/* Middle Card */}
          <Link
            href="/broker/templates/forms"
            className="group transition-all duration-300 hover:scale-[1.02]"
          >
            <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 border-slate-200 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-600 group-hover:text-slate-800 transition-colors" />
              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-semibold text-slate-800">
                  Forms Templates
                </h3>
                <p className="text-sm text-slate-600">
                  Access and manage your form templates
                </p>
              </div>
              <Button
                variant="secondary"
                className="mt-2 group-hover:bg-slate-800 group-hover:text-white transition-colors"
              >
                Open Forms
              </Button>
            </Card>
          </Link>

          {/* Right Card */}
          <Link
            href="/realtor/workspace/templates/client-intake"
            className="group transition-all duration-300 hover:scale-[1.02]"
          >
            <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 border-slate-200 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-4">
              <ClipboardList className="w-12 h-12 text-slate-600 group-hover:text-slate-800 transition-colors" />
              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-semibold text-slate-800">
                  Client Intake Templates
                </h3>
                <p className="text-sm text-slate-600">
                  Customize your client intake templates
                </p>
              </div>
              <Button
                variant="secondary"
                className="mt-2 group-hover:bg-slate-800 group-hover:text-white transition-colors"
              >
                Open Client Intake
              </Button>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionPage;
