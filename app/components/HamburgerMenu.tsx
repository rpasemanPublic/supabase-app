"use client";

import { useState } from "react";
import Link from "next/link";

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
          <Link
            href="/programs"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Programs
          </Link>
        </div>
      )}
    </div>
  );
}
