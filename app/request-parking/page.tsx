import RequestParkingPage from "@/components/request-parking/request-form";
import React from "react";
import Image from "next/image";

const RequestPage = () => {
  return (
    <div className="min-h-screen">
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Left column - Form */}
          <div className="w-full md:w-1/2">
            <RequestParkingPage />
          </div>

          {/* Right column - Image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-full aspect-square max-w-md">
              <Image
                src="/placeholder2.jpg"
                alt="Parking illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestPage;
