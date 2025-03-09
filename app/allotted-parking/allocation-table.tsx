"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ParkingRequest } from "@/actions/allocated-actions";

interface AllocationTableProps {
  allocations: ParkingRequest[];
}

export default function AllocationTable({ allocations }: AllocationTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter allocations based on search query
  const filteredAllocations = allocations.filter((allocation) => {
    const name = allocation.userDetails?.name?.toLowerCase() || "";
    const email = allocation.userDetails?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Allocations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredAllocations.length} spaces allocated
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            className="pl-10 pr-10 h-10 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 rounded text-xs px-3"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden border rounded-xl shadow-sm">
        {searchQuery && (
          <div className="bg-muted px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Search results for:</span>
              <Badge variant="secondary" className="font-normal">
                "{searchQuery}"
              </Badge>
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
              {filteredAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Car className="h-8 w-8 opacity-40" />
                      <p>No allocated parking slots found.</p>
                      {searchQuery && (
                        <p className="text-sm">Try a different search term</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAllocations.map((allocation, index) => (
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
  );
}
