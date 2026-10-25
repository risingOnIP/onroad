"use client";

import React from "react";

const SignaturesTable = () => {
  const signatures = [
    { id: 1, formName: "Lease Agreement", status: "Pending" },
    { id: 2, formName: "Purchase Agreement", status: "Completed" },
    { id: 3, formName: "Disclosure Form", status: "Pending" },
  ];

  return (
    <div className="p-4 flex-1 overflow-y-auto">
      <h1 className="text-xl font-bold mb-4">Requested Signatures</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">Form Name</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {signatures.map((signature) => (
            <tr key={signature.id}>
              <td className="border border-gray-300 px-4 py-2">{signature.formName}</td>
              <td className="border border-gray-300 px-4 py-2">{signature.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SignaturesTable;