import { Link } from "react-router-dom";

/**
 * Public Footer Component
 * Footer for public pages with company info and links
 */
export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-8">
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {currentYear} Fodderly. All rights reserved.
          </p>

          {/* Links moved here */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
