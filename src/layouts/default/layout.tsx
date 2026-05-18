import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useBodyClass } from "@/hooks/use-body-class";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollContainer } from "@/components/common/scroll-container";
import { Header, Sidebar, Toolbar, ToolbarHeading } from "@/partials";

const SIDEBAR_STORAGE_KEY = "layout.sidebar.open";
const readStoredSidebarState = (): boolean => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";
};

/**
 * Default Application Layout
 * Main layout component that includes header, sidebar, footer, and content outlet
 */
export function AppLayout() {
  const isMobile = useIsMobile();

  // Sidebar state is managed here
  const [isSidebarOpen, setIsSidebarOpen] = useState(readStoredSidebarState);

  const toggleSidebar = () => {
    // only allow toggling on desktop
    if (!isMobile) {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  // force sidebar open on mobile (< 1024px)
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(true);
      return;
    }

    setIsSidebarOpen(readStoredSidebarState());
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
    }
  }, [isMobile, isSidebarOpen]);

  useBodyClass(`
    [--header-height:60px]
    [--sidebar-width:220px]
    [--sidebar-closed-width:62px]
    lg:overflow-hidden
    bg-muted!
  `);

  return (
    <>
      <div className="flex h-screen grow overflow-hidden">
        {!isMobile && (
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}

        {isMobile && (
          <Header isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}

        <div className="flex h-full min-h-0 flex-col lg:flex-row grow pt-(--header-height) lg:pt-0">
          <div
            className={`relative z-10 flex h-full min-h-0 flex-col grow items-stretch rounded-xl bg-background border border-input mt-0 lg:mt-[15px] m-[15px]
              transition-[margin-inline-start] duration-300 ease-out
              ${isSidebarOpen ? "lg:ms-(--sidebar-width)" : "lg:ms-(--sidebar-closed-width)"}
            `}
          >
            <ScrollContainer
              className="flex min-h-0 flex-col grow pt-5"
              id="kt_wrapper-scroll"
              overflowX="hidden"
              overflowY="auto"
            >
              <main className="flex min-h-0 grow flex-col" role="content">
                <Toolbar>
                  <ToolbarHeading />
                </Toolbar>
                <div className="flex min-h-0 flex-1 flex-col">
                  <Outlet />
                </div>
              </main>
              {/* <Footer /> */}
            </ScrollContainer>
          </div>
        </div>
      </div>
    </>
  );
}
