import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

/**
 * Home Page Component
 * SEO-optimized public landing page for Fodderly
 */
export function HomePage() {
  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Fodderly",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Web, iOS, Android",
    description:
      "Fodderly management solution for job assignment, real-time tracking, and service history management",
  };

  return (
    <>
      <Helmet>
        <title>Fodderly</title>
        <meta
          name="description"
          content="Streamline operations with Fodderly. Comprehensive fodderman assignment, real-time tracking, document management, and analytics."
        />
        <meta
          name="keywords"
          content="fodderly, management, fodderman, job assignment software, inventory management, operations"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Fodderly Management Solution" />
        <meta
          property="og:description"
          content="Streamline operations with comprehensive assignment, real-time tracking, and centralized management."
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fodderly Management Solution" />
        <meta
          name="twitter:description"
          content="Streamline operations with comprehensive assignment, real-time tracking, and centralized management."
        />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="flex flex-col items-center justify-center py-20  bg-background transition-colors duration-500">
        {/* Hero Section */}
        <section className="px-6 w-full" role="banner">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 transition-colors duration-300">
              Fodderly
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto transition-colors duration-300">
              Streamline your field operations with comprehensive fodderman assignment, real-time tracking, and centralized inventory management.
            </p>
            <nav
              className="flex justify-center"
              aria-label="Primary actions"
            >
              <Link
                to="/login"
                className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
                aria-label="Get started with Fodderly"
              >
                Get Started
                <ArrowRight className="w-6 h-6" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </section>
      </div>
    </>
  );
}
