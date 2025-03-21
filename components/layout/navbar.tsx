"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
}

interface NavbarProps {
  className?: string;
}

function NavItem({ href, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {label}
    </Link>
  );
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/request-parking", label: "Request Parking" },
  { href: "/allotted-parking", label: "Allotted Parking" },
  { href: "/car-pooling", label: "Car Pooling" },
  { href: "/admin/control-panel", label: "Control Panel", role: "admin" },
];

export function Navbar({ className }: NavbarProps) {
  const activePath = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.role || item.role === userRole
  );

  return (
    <header
      className={cn(
        "w-full border-b bg-background sticky top-0 z-40 px-5",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={150}
              height={150}
              className="rounded-md"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={activePath === item.href}
            />
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Button
              onClick={() => signOut()}
              variant={"ghost"}
              className="cursor-pointer"
            >
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button variant={"ghost"} className="cursor-pointer">
                Login
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 py-6">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/placeholder.svg"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="rounded-md"
                  />
                  <span className="font-bold">ParkPoolX</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-2 py-1 text-base transition-colors",
                        activePath === item.href
                          ? "font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link href="/login">
                    <Button size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
