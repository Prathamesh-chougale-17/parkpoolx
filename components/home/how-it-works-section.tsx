interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex flex-col items-center space-y-2 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {number}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground text-center">{description}</p>
    </div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Sign Up",
      description:
        "Create an account and complete your profile with commuting preferences",
    },
    {
      number: 2,
      title: "Find What You Need",
      description:
        "Search for parking spaces or available carpools near your location",
    },
    {
      number: 3,
      title: "Book & Go",
      description: "Reserve your spot or join a carpool with just a few taps",
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Simple steps to start optimizing your parking and commuting
              experience
            </p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
          {steps.map((step) => (
            <Step
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
