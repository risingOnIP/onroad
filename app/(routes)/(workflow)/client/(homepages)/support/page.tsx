import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const ClientSupportPage = () => {
  return (
    <div>
      ClientSupportPage
      <br ></br>
      <Link href="/client/dashboard">
        <Button className="mt-4 text-center cursor-pointer">Back to Dashboard</Button>
      </Link>
    </div>
  );
};

export default ClientSupportPage;
