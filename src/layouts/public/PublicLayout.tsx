import { Outlet } from "react-router-dom";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

/**
 * Public Layout Component
 * Layout wrapper for public pages with header and footer
 */
export function PublicLayout() {
  return (
    <div className="w-full flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
