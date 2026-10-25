"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal,
  Trash2,
  Check,
} from "lucide-react";
import AddDealDialog from "./AddDealDialog";
import {
  createDeal,
  deleteDeal,
  markDealComplete,
} from "@/app/actions/realtor/deal-actions";
import { Party, Deal } from "@/components/files/types/realtor";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ---------- props ---------- */
interface DealGroupingProps {
  itemsPerPage: number;
  categoryDeals: Deal[];
  dealSide: "sell" | "buy" | "lease" | "rent";
  initialExpanded?: boolean;
}

/* ---------- helpers ---------- */
const colorClasses = {
  sell: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    action: "text-blue-600",
    hoverAction: "hover:text-blue-900",
    hoverBg: "hover:bg-blue-200",
    border: "border-blue-200",
    hover: "hover:text-blue-900",
  },
  buy: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    action: "text-orange-600",
    hoverAction: "hover:text-orange-900",
    hoverBg: "hover:bg-orange-200",
    border: "border-orange-200",
    hover: "hover:text-orange-900",
  },
  lease: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    action: "text-blue-600",
    hoverAction: "hover:text-blue-900",
    hoverBg: "hover:bg-blue-200",
    border: "border-blue-200",
    hover: "hover:text-blue-900",
  },
  rent: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    action: "text-orange-600",
    hoverAction: "hover:text-orange-900",
    hoverBg: "hover:bg-orange-200",
    border: "border-orange-200",
    hover: "hover:text-orange-900",
  },
};

const prettify = (side: "buy" | "sell" | "lease" | "rent") => {

  switch (side) {
    case "buy":
      return "Buying";
    case "sell":
      return "Selling";
    case "lease":
      return "Leasing ";
    case "rent":
      return "Renting ";
    default:
      return side;
  }
};

const getSubtext = (side: "buy" | "sell" | "lease" | "rent") => {
  switch (side) {
    case "buy":
      return "Buyer Representative";
    case "sell":
      return "Seller Representative";
    case "lease":
      return "Landlord Representative";
    case "rent":
      return "Tenant Representative";
    default:
      return side;
  }
};

/* ---------- component ---------- */
const DealGroupings: React.FC<DealGroupingProps> = ({
  categoryDeals,
  itemsPerPage,
  dealSide,
  initialExpanded = true,
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(initialExpanded);
  const [page, setPage] = useState(1);
  const [menuCoords, setMenuCoords] = useState<{ x: number; y: number } | null>(
    null
  );
  const [menuDealId, setMenuDealId] = useState<string | null>(null);

  // Refs for animation
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const onDealDelete = (dealId: string) => {
    deleteDeal(dealId);
  };

  /* Reset to first page when the deal list shrinks/expands */
  useEffect(() => setPage(1), [categoryDeals.length]);

  // Handle smooth height animations
  useEffect(() => {
    if (!contentRef.current) return;

    if (expanded) {
      // Expanding: measure content height and animate to it
      const scrollHeight = contentRef.current.scrollHeight;
      setContentHeight(scrollHeight);
      setIsAnimating(true);

      // Reset animation state after transition completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setContentHeight(null); // Allow natural height
      }, 300); // Match CSS transition duration

      return () => clearTimeout(timer);
    } else {
      // Collapsing: set current height then animate to 0
      const currentHeight = contentRef.current.scrollHeight;
      setContentHeight(currentHeight);
      setIsAnimating(true);

      // Force reflow then collapse
      requestAnimationFrame(() => {
        setContentHeight(0);
      });

      // Reset animation state after transition completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [expanded]);

  const totalPages = Math.max(
    1,
    Math.ceil(categoryDeals.length / itemsPerPage)
  );

  const paginatedDeals = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return categoryDeals.slice(start, start + itemsPerPage);
  }, [page, itemsPerPage, categoryDeals]);

  /* deal add callback */
  const handleDealAdded = async (payload: {
    deal: Omit<
      Deal,
      "id" | "user_id" | "created_at" | "isActive" | "dealSide" | "client_form"
    >;
    parties: {
      partyRole:
        | "seller"
        | "buyer"
        | "landlord"
        | "tenant"
        | "seller_agent"
        | "buyer_agent"
        | "tenant_agent"
        | "landlord_agent";
      realtorIsRepresenting: boolean;
      partyNumber: number;
      party: Omit<
        Party,
        | "id"
        | "created_at"
        | "current_transaction_status"
        | "form_information"
        | "notes"
        | "phone_number"
        | "realtor_id"
      >;
    }[];
  }) => {
    //making sendingClients
    const sendingClients: {
      role: string;
      realtorIsRepresenting: boolean;
      partyNumber: number;
      party: Omit<
        Party,
        | "id"
        | "created_at"
        | "form_information"
        | "notes"
        | "phone_number"
        | "realtor_id"
      >;
    }[] = payload.parties.map((party) => ({
      role: party.partyRole,
      realtorIsRepresenting: party.realtorIsRepresenting,
      partyNumber: party.partyNumber,
      party: {
        ...party.party,
        current_transaction_status: "searching",
      },
    }));

    //making deal

    await createDeal(
      {
        ...payload.deal,
        dealSide,
        isActive: true,
      },
      sendingClients
    );
  };

  const color = colorClasses[dealSide];
  const label = `${prettify(dealSide)}`;

  /* When the three-dots button is clicked, record:
     1) which deal ID wants its menu open
     2) the x/y coords of that button, so we can position the menu there
  */
  const showMenuForDeal = (
    dealId: string,
    buttonElement: HTMLButtonElement
  ) => {
    const rect = buttonElement.getBoundingClientRect();
    setMenuCoords({ x: rect.right, y: rect.top });
    setMenuDealId((prev) => (prev === dealId ? null : dealId));
  };

  /* close the menu if you click anywhere else */
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuDealId(null);
      setMenuCoords(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <section className="transition-all duration-300 ease-in-out">
      {/* header */}
      <header
        className={`${
          color.bg
        } px-3 py-2 flex items-center justify-between select-none border ${
          color.border
        } shadow-sm cursor-pointer hover:opacity-90 transition-opacity duration-200 ${
          expanded ? "rounded-t-lg" : "rounded-lg"
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={`text-sm font-medium ${color.text} flex items-center`}>
          <div className="transition-transform duration-300 ease-in-out mr-1">
            {expanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRightIcon size={16} />
            )}
          </div>
          <div className="flex flex-col">
            <span>{label}</span>
            <span className="text-xs text-gray-400 font-normal leading-tight mt-0.5">
              {getSubtext(dealSide)}
            </span>
          </div>
          {categoryDeals.length > 0 && (
            <span className="ml-2 bg-black/20 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {categoryDeals.length}
            </span>
          )}
        </div>

        {/* add-deal button, stop header toggle */}
        <div onClick={(e) => e.stopPropagation()}>
          <AddDealDialog
            label={label}
            dealSide={dealSide}
            colorStyles={color}
            onDealAdded={handleDealAdded}
          />
        </div>
      </header>

      {/* Animated body container */}
      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out overflow-hidden border-l border-r border-b ${
          color.border
        } ${expanded ? "rounded-b-lg" : ""}`}
        style={{
          height: isAnimating ? contentHeight ?? "auto" : expanded ? "auto" : 0,
          transform: expanded ? "translateY(0)" : "translateY(-10px)",
          opacity: expanded ? 1 : 0,
        }}
      >
        <ul
          className="bg-white divide-y divide-gray-100"
          style={{
            maxHeight: categoryDeals.length ? "12rem" : "auto",
            overflowY: "auto",
          }}
        >
          {paginatedDeals.length ? (
            paginatedDeals.map((deal) => (
              <li key={deal.id} className="relative">
                <Link
                  href={`/realtor/workspace/${deal.id}`}
                  className="group relative px-3 py-2 hover:bg-gray-50 flex items-center transition-colors duration-200"
                >
                  <div className="flex items-center min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-2 ${color.bg}`}
                    />
                    <span className="font-medium text-sm text-slate-800 truncate">
                      {deal.dealName}
                    </span>
                  </div>

                  {/* three-dots icon (only visible on hover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showMenuForDeal(deal.id, e.currentTarget);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-gray-700 ml-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </Link>
              </li>
            ))
          ) : (
            <li className="text-center p-4 text-gray-500 text-sm">
              No {dealSide} deals found
            </li>
          )}
        </ul>

        {/* pagination */}
        {totalPages > 1 && (
          <footer className="flex items-center justify-between border-t border-gray-100 px-3 py-1 bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`p-1 transition-colors duration-200 ${
                page === 1
                  ? "text-gray-300"
                  : `${color.action} ${color.hoverAction}`
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className={`p-1 transition-colors duration-200 ${
                page === totalPages
                  ? "text-gray-300"
                  : `${color.action} ${color.hoverAction}`
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </footer>
        )}
      </div>

      {/* ‣ Render the drop-up "context menu" right here, as a sibling of the <ul>,
          so it's no longer inside the scrollable list. */}
      {menuDealId && menuCoords && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-200"
          style={{
            top: `${menuCoords.y}px`,
            left: `${menuCoords.x - 160}px`,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMenuDealId(null);
              markDealComplete(menuDealId);
              router.refresh();
              // categoryDeals = categoryDeals.filter(deal => deal.id !== menuDealId);
            }}
            className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150"
          >
            <Check size={14} />
            Mark Completed
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            onClick={() => {
              setMenuDealId(null);
              onDealDelete?.(menuDealId);
              router.refresh();
            }}
            className="cursor-pointer w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-150"
          >
            <Trash2 size={14} />
            Delete Deal
          </button>
        </div>
      )}
    </section>
  );
};

export default DealGroupings;
