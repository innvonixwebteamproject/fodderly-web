import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toAbsoluteUrl } from "@/lib/helpers";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Container } from "@/components/common/container";
import { SidebarFooter } from "../sidebar/sidebar-footer";
import { SidebarHeader } from "../sidebar/sidebar-header";
import { SidebarMenu } from "../sidebar/sidebar-menu";

interface HeaderProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { pathname } = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close sheet when route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <header className="flex lg:hidden items-center fixed z-10 top-0 start-0 end-0 shrink-0 bg-muted h-(--header-height)">
      <Container className="flex items-center justify-between flex-wrap gap-3">
        <Link to="/" className="flex items-center justify-center gap-2">
          <img
            src={toAbsoluteUrl("/media/app/mini-logo-light.png")}
            className="dark:hidden min-h-[30px] max-h-[30px]"
            alt="Logo"
          />
          <img
            src={toAbsoluteUrl("/media/app/mini-logo-dark.png")}
            className="hidden dark:block min-h-[30px] max-h-[30px]"
            alt="Logo"
          />
          <span className="font-semibold text-foreground">Fodderly</span>
        </Link>

        {isMobile && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              className="p-0 gap-0 w-[275px]"
              side="left"
              close={false}
            >
              <SheetHeader className="p-0 space-y-0" />
              <SheetBody className="p-0 flex flex-col grow">
                <SidebarHeader isOpen={isSheetOpen} toggleSidebar={toggleSidebar} />
                <SidebarMenu isOpen={isSheetOpen} />
                <SidebarFooter isOpen={isSheetOpen} />
              </SheetBody>
            </SheetContent>
          </Sheet>
        )}
      </Container>
    </header>
  );
};

export { Header };
