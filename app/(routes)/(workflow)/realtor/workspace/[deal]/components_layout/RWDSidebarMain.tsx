"use client";

import { useState, useCallback, useEffect } from "react";
import { RWDSidebarLeft } from "./RWDSidebarLeft";
import { RWDSidebarRight } from "./RWDSidebarRight";
import { ChevronRight, ChevronLeft } from "lucide-react";

// Main component that combines both sidebars

interface RWDSidebarMainProps {
  dealSide: string;
  dealId: string;
}

export function RWDSidebarMain({ dealSide, dealId }: RWDSidebarMainProps) {
  // Support both hover and click functionality - start open by default
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isOpenedByClick, setIsOpenedByClick] = useState(true);

  // Prevent closing when dropdowns are active
  const [preventClose, setPreventClose] = useState(false);

  useEffect(() => {
    // Monitor dropdown state changes - only for floating overlays, not sidebar content
    const checkDropdownsActive = () => {
      // Only check for actual floating dropdowns/modals that should prevent closing
      // Exclude any elements that are part of the sidebar content itself
      const hasOpenDropdowns =
        // Dropdown menus (floating)
        document.querySelector('[data-radix-dropdown-menu-content]:not([data-radix-collapsible-content])') ||
        // Select dropdowns (floating)
        document.querySelector("[data-radix-select-content]") ||
        // Modal dialogs
        document.querySelector('[role="dialog"][data-state="open"]') ||
        // High z-index overlays that are actually floating (not sidebar content)
        document.querySelector('.z-50[data-state="open"]:not([data-radix-collapsible-content])');

      const isActive = !!hasOpenDropdowns;
      setPreventClose(isActive);
    };

    // Check initially
    checkDropdownsActive();

    // Set up mutation observer to watch for dropdown changes
    const observer = new MutationObserver((mutations) => {
      // Only check if relevant changes occurred
      const relevantChange = mutations.some(
        (mutation) =>
          (mutation.type === "attributes" &&
            (mutation.attributeName === "data-state" ||
              mutation.attributeName === "class")) ||
          mutation.type === "childList"
      );

      if (relevantChange) {
        checkDropdownsActive();
      }
    });

    // Observe changes to data-state attributes and class changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-state", "class"],
      subtree: true,
      childList: true,
    });

    // Also check on focus/blur events (for dropdowns)
    const handleFocusChange = () => {
      // Check immediately for better responsiveness
      checkDropdownsActive();
    };

    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    // Cleanup on unmount
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, []);

  // Click handler - toggles sidebar and marks as opened by click
  const toggleSidebar = useCallback(() => {
    setIsRightSidebarOpen((prev) => {
      const newState = !prev;
      setIsOpenedByClick(newState);
      return newState;
    });
  }, []);

  // Hover handlers - only work if not opened by click
  const handleMouseEnter = useCallback(() => {
    if (!isOpenedByClick) {
      setIsRightSidebarOpen(true);
      setIsOpenedByClick(false); // Ensure hover-opened sidebar can auto-close
    }
  }, [isOpenedByClick]);

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpenedByClick && !preventClose) {
        // Check if mouse is leaving to go to a dropdown or modal
        const relatedTarget = e.relatedTarget;

        // Check if relatedTarget is an Element and has the closest method
        if (
          relatedTarget &&
          typeof relatedTarget === "object" &&
          "closest" in relatedTarget &&
          typeof relatedTarget.closest === "function"
        ) {
          const element = relatedTarget as Element;

          const checks = {
            popper: element.closest("[data-radix-popper-content-wrapper]"),
            dialog: element.closest('[role="dialog"]'),
            dropdownContent: element.closest("[data-radix-dropdown-menu-content]:not([data-radix-collapsible-content])"),
            selectContent: element.closest("[data-radix-select-content]"),
            dropdownAttr: element.getAttribute("data-radix-dropdown-menu-content"),
            menu: element.closest('div[role="menu"]'),
            // Only check for floating z-50 elements, not sidebar content
            z50Floating: element.closest(".z-50[data-state='open']:not([data-radix-collapsible-content])"),
          };

          if (
            checks.popper ||
            checks.dialog ||
            checks.dropdownContent ||
            checks.selectContent ||
            checks.dropdownAttr !== null ||
            checks.menu ||
            checks.z50Floating
          ) {
            return; // Don't close sidebar if mouse moved to dropdown/modal
          }
        }

        // Close immediately for responsiveness
        setIsRightSidebarOpen(false);
      } else if (preventClose) {
      }
    },
    [isOpenedByClick, preventClose]
  );

  return (
    <>
      {/* Right Sidebar - Slides out from completely off-screen (lower z-index) */}
      <div
        className={`fixed left-0 top-0 h-full z-30 bg-sidebar border-r border-sidebar-border shadow-lg transition-transform duration-300 ease-out ${
          isRightSidebarOpen
            ? "translate-x-[calc(var(--sidebar-width-icon)*1.3+1px)]"
            : "-translate-x-full"
        }`}
        style={{ width: "var(--sidebar-width)" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <RWDSidebarRight dealId={dealId} dealSide={dealSide} />
      </div>

      {/* Left Sidebar - Always visible (highest z-index to stay on top) */}
      <div
        className="fixed left-0 top-0 h-full z-40 bg-sidebar border-r border-sidebar-border"
        style={{ width: "calc(var(--sidebar-width-icon) * 1.3 + 1px)" }}
        onMouseEnter={handleMouseEnter}
      >
        <RWDSidebarLeft />
      </div>

      {/* Arrow toggle button */}
      <button
        onClick={toggleSidebar}
        onMouseEnter={handleMouseEnter}
        className="fixed z-50 bg-sidebar border border-sidebar-border rounded-r-md shadow-md hover:bg-accent transition-colors duration-200 p-1"
        style={{
          left: isRightSidebarOpen
            ? "calc(var(--sidebar-width-icon) * 1.3 + var(--sidebar-width) + 1px)"
            : "calc(var(--sidebar-width-icon) * 1.3 + 1px)",
          top: "50%",
          transform: "translateY(-50%)",
        }}
        aria-label={isRightSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isRightSidebarOpen ? (
          <ChevronLeft className="h-4 w-4 scale-125" />
        ) : (
          <ChevronRight className="h-4 w-4 scale-125" />
        )}
      </button>
    </>
  );
}

