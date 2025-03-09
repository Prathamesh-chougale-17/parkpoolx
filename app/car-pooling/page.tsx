import { Suspense } from "react";
import { getUserCarpoolStatus } from "@/actions/carpool-actions";
import CarpoolProvider from "@/components/car-pooling/carpool-provider";
import CarpoolSeeker from "@/components/car-pooling/carpool-seeker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function CarPoolingPage() {
  const { status, error } = await getUserCarpoolStatus();

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Car Pooling</h1>
          <p className="text-muted-foreground">
            Find or offer rides to your colleagues and make commuting easier
          </p>
        </div>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access car pooling features
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Suspense fallback={<LoadingSkeleton />}>
            {status === "approved" ? (
              <CarpoolProvider />
            ) : (
              <CarpoolSeeker currentStatus={status} />
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-md" />
            <div className="flex gap-4 mt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
