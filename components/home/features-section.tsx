import { Car, MapPin, Clock, Users, Shield, Search } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card">
      <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground text-center">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: "Smart Parking System",
      description:
        "Find available parking spaces in real-time using our predictive bay algorithm",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Carpooling Management",
      description:
        "Connect with others heading your way to reduce costs and emissions",
    },
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: "Nearest Ride Finding",
      description:
        "Our algorithm finds the most convenient carpools matching your route",
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Real-Time Updates",
      description:
        "Get live information on parking availability and carpool status",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Secure Authentication",
      description:
        "OTP-based authentication and encrypted data for maximum security",
    },
    {
      icon: <Car className="h-6 w-6 text-primary" />,
      title: "Map Integration",
      description:
        "Interactive maps showing parking spots, routes, and carpool pickup points",
    },
  ];

  return (
    <section id="features" className="w-full py-12 md:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Key Features
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Everything you need to optimize parking and improve your commute
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
