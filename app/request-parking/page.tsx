import RequestParkingPage from "@/components/request-parking/request-form";
import React from "react";

const RequestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm sm:shadow-lg dark:shadow-gray-700/30 p-4 sm:p-6 md:p-10 relative overflow-hidden">
          {/* Decorative element - hidden on small screens */}
          <div className="hidden sm:block absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 md:w-40 md:h-40 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-70"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 -mb-10 -ml-10 w-20 h-20 md:w-32 md:h-32 bg-green-100 dark:bg-green-900/30 rounded-full opacity-70"></div>

          <div className="relative z-10">
            <div className="mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Find Your Perfect Parking Space
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mt-1 sm:mt-2">
                Complete the form below to request a parking spot that meets
                your needs.
              </p>
            </div>

            {/* The actual RequestParkingPage component remains unchanged */}
            <RequestParkingPage />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestPage;
