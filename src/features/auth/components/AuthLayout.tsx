import { Link, Outlet } from "react-router-dom";
import { toAbsoluteUrl } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout() {
  return (
    <div className="flex flex-col w-screen min-h-screen bg-background text-foreground items-center justify-center relative overflow-hidden m-0 p-0">
      
      {/* Seamless Connecting Grass Area in Center */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-[3vh] lg:h-[5vh] bg-[#9fc485] dark:bg-[#345322] z-0 hidden md:block" style={{ borderTop: '2px solid rgba(0,0,0,0.05)' }}></div> */}

      {/* Seamless Connecting Grass Area in Center */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-[3vh] lg:h-[4vh] bg-[#9fc485]/40 dark:bg-[#345322]/40 z-0 hidden md:block border-t border-black/5"></div> */}

      {/* Left decorative: Farmer (Transparent, High Quality) */}
      {/* <div className="absolute bottom-8 left-8 lg:left-12 w-[30vw] max-w-[180px] z-0 pointer-events-none animate-in slide-in-from-left-10 duration-1000">
        <img
          src={toAbsoluteUrl("/media/images/background/farmer_left.png?v=4")}
          className="w-full h-auto object-contain drop-shadow-xl dark:drop-shadow-none"
          alt="Farmer"
        />
      </div> */}

      {/* Right decorative: Cow (Transparent, High Quality, Flipped to face center) */}
      {/* <div className="absolute bottom-8 right-8 lg:right-12 w-[30vw] max-w-[180px] z-0 pointer-events-none animate-in slide-in-from-right-10 duration-1000">
        <img
          src={toAbsoluteUrl("/media/images/background/cow_right.png?v=4")}
          className="w-full h-auto object-contain scale-x-[-1] drop-shadow-xl dark:drop-shadow-none"
          alt="Cow"
        />
      </div> */}

      {/* Perfectly Centered Login Form with enforced autos */}
      <div className="w-full max-w-[440px] px-6 lg:px-8 mx-auto relative z-10 animate-in fade-in zoom-in-95 duration-500 ease-out flex flex-col justify-center items-center self-center">
        {/* Logo prominently at the top */}
        <div className="mb-8 w-full flex justify-center text-center">
          <Link to="/" className="inline-flex hover:scale-105 transition-transform duration-300 mx-auto justify-center">
            <img
              src={toAbsoluteUrl("/media/app/logo-light.png")}
              className="dark:hidden h-16 sm:h-[4.5rem] w-auto object-contain drop-shadow-md mx-auto"
              alt="Fodderly Logo"
            />
            <img
              src={toAbsoluteUrl("/media/app/logo-dark.png")}
              className="hidden dark:block h-16 sm:h-[4.5rem] w-auto object-contain drop-shadow-md mx-auto"
              alt="Fodderly Logo"
            />
          </Link>
        </div>
        
        <Card className="w-full shadow-[0_8px_40px_rgb(0,0,0,0.12)] border-0 rounded-2xl bg-card overflow-hidden relative z-20 mx-auto">
          <CardContent className="p-8 sm:p-10 text-center sm:text-left">
            <Outlet />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
