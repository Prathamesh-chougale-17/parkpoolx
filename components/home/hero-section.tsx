import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Car, MapPin } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Smart Parking & Carpooling Solution
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Optimize parking, reduce congestion, and find rides easily with
                our integrated platform.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="gap-1">
                <Link href="/find-parking">
                  <MapPin className="h-4 w-4" />
                  Find Parking
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-1">
                <Link href="/find-carpools">
                  <Car className="h-4 w-4" />
                  Join Carpool
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
            <Image
              src="/placeholder.svg"
              alt="Smart parking illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
