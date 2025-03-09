import React from "react";
import {
  getAllAllocations,
  getUserAllocationStatus,
} from "@/actions/allocated-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Car, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AllottedParkingPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) => {
  const searchQuery = (await searchParams).search || "";
  const userStatus = await getUserAllocationStatus();
  const { allocations = [] } = await getAllAllocations(searchQuery);

  let statusMessage = "";
  let statusTitle = "";
  let statusVariant: "default" | "success" | "destructive" = "default";
  let StatusIcon = Clock;

  if (userStatus.error) {
    statusMessage = "Please sign in to check your allocation status.";
    statusTitle = "Authentication Required";
    StatusIcon = AlertCircle;
  } else if (userStatus.status === "not_found") {
    statusMessage = "You haven't made any request.";
    statusTitle = "No Request Found";
    StatusIcon = AlertCircle;
  } else if (userStatus.status === "pending") {
    statusMessage =
      "Your request is being processed. You'll be notified when a decision is made.";
    statusTitle = "Request Pending";
    statusVariant = "destructive";
    StatusIcon = Clock;
  } else if (userStatus.status === "approved") {
    statusMessage = `Congratulations! You've been allocated a parking space.`;
    statusTitle = "Parking Allocated";
    statusVariant = "success";
    StatusIcon = CheckCircle;
  }

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col gap-10">
        {/* Header section */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Parking Allocations
          </h1>
          <p className="text-muted-foreground">
            View all allocated parking spaces and check your status
          </p>
        </div>

        {/* Status Card */}
        <Card
          className={`border-2 ${
            statusVariant === "success"
              ? "border-green-500 bg-green-50"
              : statusVariant === "destructive"
              ? "border-red-500 bg-red-50"
              : "border-gray-200"
          } rounded-xl shadow-sm`}
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${
                statusVariant === "success"
                  ? "bg-green-100 text-green-600"
                  : statusVariant === "destructive"
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                {statusTitle}
              </CardTitle>
              <CardDescription>Your parking allocation status</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={`${
                statusVariant === "success"
                  ? "text-green-700"
                  : statusVariant === "destructive"
                  ? "text-red-700"
                  : "text-gray-700"
              } font-medium py-2`}
            >
              {statusMessage}
            </p>
          </CardContent>
          {userStatus.status === "approved" && userStatus.slotNumber && (
            <CardFooter className="bg-green-100 py-3 px-6 border-t border-green-200">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">
                  Slot Number: {userStatus.slotNumber}
                </span>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* All Allocations Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                All Allocations
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {allocations.length} spaces allocated
              </p>
            </div>
            <form className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Search by name..."
                className="pl-10 pr-24 h-10 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                defaultValue={searchQuery}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 rounded text-xs px-3"
              >
                Search
              </Button>
            </form>
          </div>

          <Card className="overflow-hidden border rounded-xl shadow-sm">
            {searchQuery && (
              <div className="bg-muted px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Search results for:
                  </span>
                  <Badge variant="secondary" className="font-normal">
                    &quot;{searchQuery}&quot;
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 ml-auto"
                    asChild
                  >
                    <a href="/allotted-parking">Clear</a>
                  </Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Car className="h-8 w-8 opacity-40" />
                          <p>No allocated parking slots found.</p>
                          {searchQuery && (
                            <p className="text-sm">
                              Try a different search term
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allocations.map((allocation, index) => (
                      <TableRow
                        key={allocation._id.toString()}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {allocation.userDetails?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {allocation.userDetails?.email || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AllottedParkingPage;
