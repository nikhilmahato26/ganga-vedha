"use client";

import * as React from "react";
import Link from "next/link";
import { EnquiryDialog, type EnquiryProduct } from "@/components/site/enquiry";
import { cn } from "@/lib/utils";

export interface HeroQuickBookingProps {
  raftingProduct: EnquiryProduct;
  hotelProduct: EnquiryProduct;
  bungeeProduct: EnquiryProduct;
  whatsappNumber: string;
  className?: string;
}

export function HeroQuickBooking({
  raftingProduct,
  hotelProduct,
  bungeeProduct,
  whatsappNumber,
  className,
}: HeroQuickBookingProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<EnquiryProduct | null>(null);

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-start gap-4 sm:gap-6 lg:gap-8",
          className,
        )}
        role="region"
        aria-label="Quick booking options"
      >
        {/* Column 1: Rafting */}
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          <Link
            href="/rafting"
            className="inline-flex min-h-[44px] sm:min-h-[48px] items-center justify-center rounded-full bg-white px-5 sm:px-6 py-2 text-center text-sm sm:text-base font-bold tracking-tight text-granite-950 shadow-md shadow-black/25 transition-all duration-200 hover:scale-[1.03] hover:bg-granite-50 hover:shadow-lg active:scale-[0.98] border border-white/60 select-none whitespace-nowrap"
          >
            Book rafting
          </Link>
          <button
            type="button"
            onClick={() => setSelectedProduct(raftingProduct)}
            className="inline-flex min-h-[38px] sm:min-h-[42px] items-center justify-center rounded-full bg-white px-4 sm:px-5 py-1.5 text-center text-xs sm:text-sm font-semibold tracking-tight text-granite-900 shadow-md shadow-black/20 transition-all duration-200 hover:scale-[1.03] hover:bg-granite-50 hover:shadow-lg active:scale-[0.98] border border-white/50 select-none whitespace-nowrap cursor-pointer"
          >
            Get the best price
          </button>
        </div>

        {/* Column 2: Hotels */}
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          <Link
            href="/hotels"
            className="inline-flex min-h-[44px] sm:min-h-[48px] items-center justify-center rounded-full bg-white px-5 sm:px-6 py-2 text-center text-sm sm:text-base font-bold tracking-tight text-granite-950 shadow-md shadow-black/25 transition-all duration-200 hover:scale-[1.03] hover:bg-granite-50 hover:shadow-lg active:scale-[0.98] border border-white/60 select-none whitespace-nowrap"
          >
            Book hotels Rooms
          </Link>
          <button
            type="button"
            onClick={() => setSelectedProduct(hotelProduct)}
            className="inline-flex min-h-[38px] sm:min-h-[42px] items-center justify-center rounded-md sm:rounded-lg bg-[#b82e24] px-5 sm:px-6 py-1.5 text-center text-xs sm:text-sm font-bold tracking-tight text-white shadow-md shadow-red-950/40 transition-all duration-200 hover:scale-[1.03] hover:bg-[#a1231a] hover:shadow-lg active:scale-[0.98] border border-red-500/30 select-none whitespace-nowrap cursor-pointer"
          >
            Get the Best Price
          </button>
        </div>

        {/* Column 3: Bungee Jumping */}
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          <Link
            href="/bungee"
            className="inline-flex min-h-[44px] sm:min-h-[48px] items-center justify-center rounded-full bg-white px-5 sm:px-6 py-2 text-center text-sm sm:text-base font-bold tracking-tight text-granite-950 shadow-md shadow-black/25 transition-all duration-200 hover:scale-[1.03] hover:bg-granite-50 hover:shadow-lg active:scale-[0.98] border border-white/60 select-none whitespace-nowrap"
          >
            Book bungee jumping
          </Link>
          <button
            type="button"
            onClick={() => setSelectedProduct(bungeeProduct)}
            className="inline-flex min-h-[38px] sm:min-h-[42px] items-center justify-center rounded-full bg-white px-4 sm:px-5 py-1.5 text-center text-xs sm:text-sm font-semibold tracking-tight text-granite-900 shadow-md shadow-black/20 transition-all duration-200 hover:scale-[1.03] hover:bg-granite-50 hover:shadow-lg active:scale-[0.98] border border-white/50 select-none whitespace-nowrap cursor-pointer"
          >
            Get the best price
          </button>
        </div>
      </div>

      {selectedProduct && (
        <EnquiryDialog
          product={selectedProduct}
          open={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          source="hero"
          whatsappNumber={whatsappNumber}
        />
      )}
    </>
  );
}
