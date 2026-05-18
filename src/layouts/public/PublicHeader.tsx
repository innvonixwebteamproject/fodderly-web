import { Link, NavLink } from "react-router-dom";
import { toAbsoluteUrl } from "@/lib/helpers";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Public Header Component
 * Navigation bar for public pages
 */
export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={toAbsoluteUrl("/media/app/mini-logo-light.png")}
              className="dark:hidden h-[32px]"
              alt="Fodderly Logo"
            />
            <img
              src={toAbsoluteUrl("/media/app/mini-logo-dark.png")}
              className="hidden dark:inline-block h-[32px]"
              alt="Fodderly Logo"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium transition-colors hover:text-foreground",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground",
                  )
                }
              >
                {link.name}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="ml-4 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "text-sm font-medium transition-colors hover:text-foreground",
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground",
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors text-center"
              >
                Login
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
