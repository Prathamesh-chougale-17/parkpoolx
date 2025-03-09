"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/time-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { submitParkingRequest } from "@/actions/request-action";
import dynamic from "next/dynamic";
import { Location } from "@/actions/carpool-actions";
import { MapPin } from "lucide-react";

// Dynamically import LeafletComponents with SSR disabled
const LeafletComponents = dynamic(
  () =>
    import("@/components/car-pooling/leaflet-components").then(
      (mod) => mod.LeafletComponents
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] border rounded-md bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

// Type definitions
interface FormErrorAlertProps {
  message: string | null;
}

// Form schema using zod
const parkingFormSchema = z
  .object({
    departTimeFromHome: z
      .string({
        required_error: "Please select an arrival time.",
      })
      .min(1, "Please select an arrival time."),
    departureTimeFromOffice: z
      .string({
        required_error: "Please select a departure time.",
      })
      .min(1, "Please select a departure time."),
    carpoolOffer: z
      .string({
        required_error:
          "Please indicate if you'd like to offer a carpool ride.",
      })
      .min(1, "Please select an option."),
    seatsAvailable: z.string().optional(),
    startLocation: z
      .object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.carpoolOffer === "yes") {
        const seats = data.seatsAvailable;
        if (!seats || seats === "") return false;
        const numSeats = parseInt(seats, 10);
        return !isNaN(numSeats) && numSeats > 0;
      }
      return true;
    },
    {
      message: "Please enter a valid number of seats greater than 0.",
      path: ["seatsAvailable"],
    }
  )
  .refine(
    (data) => {
      if (data.carpoolOffer === "yes" && !data.startLocation) {
        return false;
      }
      return true;
    },
    {
      message: "Please select your starting location.",
      path: ["startLocation"],
    }
  )
  .refine(
    (data) => {
      // Check if departure time is after arrival time
      if (data.departTimeFromHome && data.departureTimeFromOffice) {
        return data.departureTimeFromOffice > data.departTimeFromHome;
      }
      return true;
    },
    {
      message: "Departure time must be after arrival time.",
      path: ["departureTimeFromOffice"],
    }
  );

type ParkingFormValues = z.infer<typeof parkingFormSchema>;

// Helper components
function FormErrorAlert({ message }: FormErrorAlertProps) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// Fixed destination location
const DESTINATION_LOCATION = {
  lat: 18.5204,
  lng: 73.8567,
  address: "Pune, Maharashtra, India",
};

// Main component
export default function RequestParkingPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  // Default form values
  const defaultValues: Partial<ParkingFormValues> = {
    departTimeFromHome: "",
    departureTimeFromOffice: "",
    carpoolOffer: "",
    seatsAvailable: "",
    startLocation: undefined,
  };

  const form = useForm<ParkingFormValues>({
    resolver: zodResolver(parkingFormSchema),
    defaultValues,
    mode: "onBlur", // Validate on blur for better UX
  });

  // Watch the carpoolOffer field to conditionally show additional fields
  const carpoolOfferValue = form.watch("carpoolOffer");

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setUserLocation(location);
    form.setValue("startLocation", location, { shouldValidate: true });
  };

  async function onSubmit(data: ParkingFormValues) {
    try {
      setFormError(null);
      setIsSubmitting(true);

      // Set destination location for all users offering carpooling
      const formData = {
        ...data,
        endLocation:
          data.carpoolOffer === "yes" ? DESTINATION_LOCATION : undefined,
      };

      // Call the server action to submit the form data
      const result = await submitParkingRequest(formData);

      if (result.success) {
        toast.success(result.message);
        // Reset form after successful submission
        form.reset(defaultValues);
        setUserLocation(null);
      } else {
        setFormError(result.message);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setFormError("Failed to book parking slot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Book Your Parking Slot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-6 mb-6"></div>}>
          <FormErrorAlert message={formError} />
        </Suspense>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="departTimeFromHome"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Arrival Time</FormLabel>
                  <FormControl>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departureTimeFromOffice"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Departure Time</FormLabel>
                  <FormControl>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carpoolOffer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Would you like to offer a carpool ride?</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== "yes") {
                        form.setValue("seatsAvailable", "");
                        form.setValue("startLocation", undefined);
                      }
                    }}
                    value={field.value}
                    disabled={isSubmitting}
                    onOpenChange={() => field.onBlur()}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes" className="cursor-pointer">
                        Yes, I can offer a ride
                      </SelectItem>
                      <SelectItem value="no" className="cursor-pointer">
                        No, just parking for me
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Help your colleagues by sharing your ride
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {carpoolOfferValue === "yes" && (
              <>
                <FormField
                  control={form.control}
                  name="seatsAvailable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of seats available</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter number of seats"
                          {...field}
                          disabled={isSubmitting}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormDescription>
                        How many passengers can you accommodate?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startLocation"
                  render={() => (
                    <FormItem>
                      <FormLabel>Your Starting Location</FormLabel>
                      <FormControl>
                        <div className="mt-1">
                          <LeafletComponents
                            location={userLocation}
                            onLocationSelect={handleLocationSelect}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Click on the map to set your pickup location or allow
                        automatic detection
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 p-4 rounded-md border flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Destination: {DESTINATION_LOCATION.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the fixed destination for all carpooling services.
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full sm:w-auto cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Book Parking Slot"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
