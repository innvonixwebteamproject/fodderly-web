import { Link } from "react-router-dom";
import { toAbsoluteUrl } from "@/lib/helpers";

export function Error403() {
  return (
    <>
      <div className="mb-10 text-center">
        <img
          src={toAbsoluteUrl("/media/illustrations/5.svg")}
          className="dark:hidden max-h-[300px] mx-auto"
          alt="image"
        />
        <img
          src={toAbsoluteUrl("/media/illustrations/5-dark.svg")}
          className="hidden dark:block max-h-[300px] mx-auto"
          alt="image"
        />
      </div>
      <span className="badge badge-primary badge-outline mb-3">403 Error</span>

      <h3 className="text-2xl font-semibold text-mono text-center mb-2">
        Access Forbidden
      </h3>

      <div className="text-base text-center text-secondary-foreground mb-10">
        You don't have permission to access this resource.&nbsp;
        <Link
          to="/"
          className="text-primary font-medium hover:text-primary-active"
        >
          Return Home
        </Link>
        &nbsp;or contact support if you believe this is an error.
      </div>
    </>
  );
}
