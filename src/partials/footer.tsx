export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t border-border py-4 px-6 text-center text-sm text-muted-foreground mt-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <p>© {currentYear} Fodderly. All rights reserved.</p>
        <div className="flex gap-4 justify-center sm:justify-end">
          <a href="#" className="hover:text-foreground transition">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-foreground transition">
            Terms of Service
          </a>
          <a href="#" className="hover:text-foreground transition">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
