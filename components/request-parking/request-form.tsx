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

// Type definitions
interface FormErrorAlertProps {
  message: string | null;
}

// Form schema using zod
const parkingFormSchema = z
  .object({
    arrivalTime: z
      .string({
        required_error: "Please select an arrival time.",
      })
      .min(1, "Please select an arrival time."),
    departureTime: z
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
      // Check if departure time is after arrival time
      if (data.arrivalTime && data.departureTime) {
        return data.departureTime > data.arrivalTime;
      }
      return true;
    },
    {
      message: "Departure time must be after arrival time.",
      path: ["departureTime"],
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

// Main component
export default function RequestParkingPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default form values
  const defaultValues: Partial<ParkingFormValues> = {
    arrivalTime: "",
    departureTime: "",
    carpoolOffer: "",
    seatsAvailable: "",
  };

  const form = useForm<ParkingFormValues>({
    resolver: zodResolver(parkingFormSchema),
    defaultValues,
    mode: "onBlur", // Validate on blur for better UX
  });

  // Watch the carpoolOffer field to conditionally show the seats input
  const carpoolOfferValue = form.watch("carpoolOffer");

  async function onSubmit(data: ParkingFormValues) {
    try {
      setFormError(null);
      setIsSubmitting(true);

      // Handle the form submission
      console.log("Form submitted:", data);
      // TODO: Add API call to submit the form data

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Parking slot booked successfully!");
      // Success handling
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
              name="arrivalTime"
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
              name="departureTime"
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
                      }
                    }}
                    value={field.value}
                    disabled={isSubmitting}
                    onOpenChange={() => field.onBlur()}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">
                        Yes, I can offer a ride
                      </SelectItem>
                      <SelectItem value="no">
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
