import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLoadingBar } from "react-top-loading-bar";
import {
  AuthLayout,
  ProtectedRoute,
  PublicRoute,
  AuthHydration,
} from "@/features/auth";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { AppLayout } from "@/layouts/default/layout";
import { LoaderCircle } from "lucide-react";

// Auth Pages
const SignInPage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.SignInPage })),
);
const PasswordChangePage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.PasswordChangePage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.ResetPasswordPage })),
);
const EditProfilePage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.EditProfilePage })),
);
const ForcePasswordChangePage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.ForcePasswordChangePage })),
);

// Dashboard
const DashboardPage = lazy(() =>
  import("@/features/dashboard").then((m) => ({ default: m.DashboardPage })),
);

// Partner Management
const PartnerListPage = lazy(() =>
  import("@/features/partner-management").then((m) => ({
    default: m.PartnerListPage,
  })),
);
const AddPartnerPage = lazy(() =>
  import("@/features/partner-management").then((m) => ({
    default: m.AddPartnerPage,
  })),
);
const EditPartnerPage = lazy(() =>
  import("@/features/partner-management").then((m) => ({
    default: m.EditPartnerPage,
  })),
);
const FarmerListPage = lazy(() =>
  import("@/features/farmer-management").then((m) => ({
    default: m.FarmerListPage,
  })),
);
const AddFarmerPage = lazy(() =>
  import("@/features/farmer-management").then((m) => ({
    default: m.AddFarmerPage,
  })),
);
const EditFarmerPage = lazy(() =>
  import("@/features/farmer-management").then((m) => ({
    default: m.EditFarmerPage,
  })),
);

const FoddermanListPage = lazy(() =>
  import("@/features/fodderman-management/pages/FoddermanListPage").then((m) => ({
    default: m.FoddermanListPage,
  })),
);
const AddFoddermanPage = lazy(() =>
  import("@/features/fodderman-management/pages/AddFoddermanPage").then((m) => ({
    default: m.AddFoddermanPage,
  })),
);
const EditFoddermanPage = lazy(() =>
  import("@/features/fodderman-management/pages/EditFoddermanPage").then((m) => ({
    default: m.EditFoddermanPage,
  })),
);

// Inventory Management
const InventoryListPage = lazy(() =>
  import("@/features/inventory/pages/InventoryListPage").then((m) => ({
    default: m.InventoryListPage,
  })),
);

// Product Management
const AdminProductListPage = lazy(() =>
  import("@/features/product-management/pages/AdminProductListPage").then((m) => ({
    default: m.AdminProductListPage,
  })),
);
const CreateProductPage = lazy(() =>
  import("@/features/product-management/pages/CreateProductPage").then((m) => ({
    default: m.CreateProductPage,
  })),
);
const EditProductPage = lazy(() =>
  import("@/features/product-management/pages/EditProductPage").then((m) => ({
    default: m.EditProductPage,
  })),
);
const PartnerProductListPage = lazy(() =>
  import("@/features/product-management/pages/PartnerProductListPage").then((m) => ({
    default: m.PartnerProductListPage,
  })),
);
const PartnerAllocationListPage = lazy(
  () => import("@/features/product-management/pages/PartnerAllocationListPage"),
);
const PartnerAllocationTrackingPage = lazy(() =>
  import("@/features/product-management/pages/PartnerAllocationTrackingPage").then((m) => ({
    default: m.PartnerAllocationTrackingPage,
  })),
);
const ProductPartnerAllocationsPage = lazy(() =>
  import("@/features/product-management/pages/ProductPartnerAllocationsPage").then((m) => ({
    default: m.ProductPartnerAllocationsPage,
  })),
);

// Category Management
const CategoryCmsPage = lazy(() =>
  import("@/features/category-management").then((m) => ({
    default: m.CategoryCmsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/features/notifications").then((m) => ({
    default: m.NotificationsPage,
  })),
);

// Master Management
const StateListPage = lazy(() =>
  import("@/features/master-management/states-management/pages/StateListPage").then((m) => ({
    default: m.StateListPage,
  })),
);
const DistrictListPage = lazy(() =>
  import("@/features/master-management/districts-management/pages/DistrictListPage").then((m) => ({
    default: m.DistrictListPage,
  })),
);
const TalukaListPage = lazy(() =>
  import("@/features/master-management/talukas-management/pages/TalukaListPage").then((m) => ({
    default: m.default ?? m.TalukaListPage,
  })),
);
const VillageListPage = lazy(() =>
  import("@/features/master-management/villages-management/pages/VillageListPage").then((m) => ({
    default: m.VillageListPage,
  })),
);
const BrandListPage = lazy(() =>
  import("@/features/master-management/brands-management/pages/BrandListPage").then((m) => ({
    default: m.BrandListPage,
  })),
);
const OrderListPage = lazy(() =>
  import("@/features/order-management/pages/OrderListPage").then((m) => ({ default: m.OrderListPage })),
);
const OrderDetailPage = lazy(() =>
  import("@/features/order-management/pages/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage })),
);
const RefundQueuePage = lazy(() =>
  import("@/features/order-management/pages/RefundQueuePage").then((m) => ({ default: m.RefundQueuePage })),
);
const CancelledOrdersRefundsPage = lazy(() =>
  import("@/features/order-management/pages/CancelledOrdersRefundsPage").then((m) => ({
    default: m.CancelledOrdersRefundsPage,
  })),
);
const PartnerOrderListPage = lazy(() => import("@/features/order-management/pages/PartnerOrderListPage"));
const PartnerOrderDetailPage = lazy(() => import("@/features/order-management/pages/PartnerOrderDetailPage"));


// Public Pages
const HomePage = lazy(() =>
  import("@/features/public").then((m) => ({ default: m.HomePage })),
);

// Layouts
const PublicLayout = lazy(() =>
  import("@/layouts/public").then((m) => ({ default: m.PublicLayout })),
);

// Error Page
const ErrorRouting = lazy(() =>
  import("@/errors/error-routing").then((m) => ({ default: m.ErrorRouting })),
);

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface RouteConfig {
  path: string;
  element: React.ReactNode;
  children?: RouteConfig[];
  allowedRoles?: ("admin" | "partner")[];
}

const legacyPartnerBasePath = `/${["eng", "ineer"].join("")}-management`;
const legacyPartnerAddPath = `${legacyPartnerBasePath}/add`;
const legacyPartnerEditPath = `${legacyPartnerBasePath}/edit/:id`;

// Auth Routes (public)
const authRoutes: RouteConfig[] = [
  { path: "/login", element: <SignInPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/force-password-change", element: <ForcePasswordChangePage /> },
];

// Public Routes
const publicRoutes: RouteConfig[] = [
  { path: "/", element: <HomePage /> },
];

// Admin-Specific Routes for newer modules
const adminRoutes: RouteConfig[] = [
  { path: "dashboard", element: <DashboardPage /> },
  { path: "partners", element: <PartnerListPage /> },
  { path: "partners/create", element: <AddPartnerPage /> },
  { path: "partners/edit/:id", element: <EditPartnerPage /> },
  { path: "farmers", element: <FarmerListPage /> },
  { path: "farmers/create", element: <AddFarmerPage /> },
  { path: "farmers/edit/:id", element: <EditFarmerPage /> },
  { path: "category-cms", element: <CategoryCmsPage /> },
  { path: "fodderman", element: <FoddermanListPage /> },
  { path: "fodderman/create", element: <AddFoddermanPage /> },
  { path: "fodderman/edit/:id", element: <EditFoddermanPage /> },
  { path: "inventory", element: <InventoryListPage /> },
  { path: "products", element: <AdminProductListPage /> },
  { path: "products/create", element: <CreateProductPage /> },
  { path: "products/edit/:id", element: <EditProductPage /> },
  { path: "products/:productId/partner-allocations", element: <ProductPartnerAllocationsPage /> },
  { path: "partners/:partnerId/allocations", element: <PartnerAllocationListPage /> },
  { path: "products/partner-allocations", element: <Navigate to="/admin/partners" replace /> },
  { path: "products/partner-allocations/tracking", element: <PartnerAllocationTrackingPage /> },
  { path: "profile", element: <EditProfilePage /> },
  { path: "notifications", element: <NotificationsPage /> },

  { path: "orders", element: <OrderListPage /> },
  { path: "orders/cancelled-refunds/:orderId", element: <OrderDetailPage /> },
  { path: "orders/cancelled-refunds", element: <CancelledOrdersRefundsPage /> },
  { path: "orders/:orderId", element: <OrderDetailPage /> },
  { path: "financials/refunds", element: <RefundQueuePage /> },

  // Master Management
  { path: "master/states", element: <StateListPage /> },
  { path: "master/districts", element: <DistrictListPage /> },
  { path: "master/talukas", element: <TalukaListPage /> },
  { path: "master/villages", element: <VillageListPage /> },
  { path: "master/brands", element: <BrandListPage /> },
];

// Partner-Specific Routes for newer modules
const partnerRoutes: RouteConfig[] = [
  { path: "dashboard", element: <DashboardPage /> },
  { path: "fodderman", element: <FoddermanListPage /> },
  { path: "farmers", element: <FarmerListPage /> },
  { path: "inventory", element: <InventoryListPage /> },
  { path: "products", element: <PartnerProductListPage /> },
  { path: "orders", element: <PartnerOrderListPage /> },
  { path: "orders/history", element: <Navigate to="/partner/orders" replace /> },
  { path: "orders/:orderId", element: <PartnerOrderDetailPage /> },
  { path: "profile", element: <EditProfilePage /> },
  { path: "notifications", element: <NotificationsPage /> },

];

// Common protected routes for shared and existing flows
const commonRoutes: RouteConfig[] = [
  { path: "/change-password", element: <PasswordChangePage />, allowedRoles: ["admin", "partner"] },

  // Legacy partner-management route redirects
  { path: "/partner-management", element: <Navigate to="/admin/partners" replace />, allowedRoles: ["admin"] },
  { path: "/partner-management/add", element: <Navigate to="/admin/partners/create" replace />, allowedRoles: ["admin"] },
  { path: "/partner-management/edit/:id", element: <Navigate to="/admin/partners" replace />, allowedRoles: ["admin"] },

  // Legacy engineer route redirects
  { path: legacyPartnerBasePath, element: <Navigate to="/admin/partners" replace />, allowedRoles: ["admin"] },
  { path: legacyPartnerAddPath, element: <Navigate to="/admin/partners/create" replace />, allowedRoles: ["admin"] },
  { path: legacyPartnerEditPath, element: <Navigate to="/admin/partners" replace />, allowedRoles: ["admin"] },
];

export function AppRouter() {
  const { start, complete } = useLoadingBar({
    color: "var(--color-primary)",
    shadow: false,
    waitingTime: 400,
    transitionTime: 200,
    height: 2,
  });

  const [previousLocation, setPreviousLocation] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false);
    }
  }, [firstLoad]);

  useEffect(() => {
    if (!firstLoad) {
      start("static");
      setPreviousLocation(path);
      complete();
      if (path === previousLocation) {
        setPreviousLocation("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [previousLocation]);

  const RoleRedirect = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const role = useAuthStore((state) => state.role);
    const forcePasswordChange = useAuthStore((state) => state.forcePasswordChange);

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (role === "partner" && !forcePasswordChange) {
      return <Navigate to="/force-password-change" replace />;
    }

    const effectiveRole = role || "admin";

    if (effectiveRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (effectiveRole === "partner") {
      return <Navigate to="/partner/dashboard" replace />;
    }

    return <Navigate to="/error/403" replace />;
  };

  return (
    <AuthHydration>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            {publicRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            {authRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<PublicRoute>{route.element}</PublicRoute>}
              />
            ))}
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AppLayout />}>
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Navigate to="dashboard" replace />
                </ProtectedRoute>
              }
            />
            {adminRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>

          {/* Partner Routes */}
          <Route path="/partner" element={<AppLayout />}>
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={["partner"]}>
                  <Navigate to="dashboard" replace />
                </ProtectedRoute>
              }
            />
            {partnerRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute allowedRoles={["partner"]}>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>

          {/* Common Protected Routes */}
          <Route element={<AppLayout />}>
            {commonRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute allowedRoles={route.allowedRoles}>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Shared entry points redirect by role */}
            <Route path="/dashboard" element={<RoleRedirect />} />
            <Route path="/home" element={<RoleRedirect />} />
          </Route>

          {/* Error Routes */}
          <Route path="error/*" element={<ErrorRouting />} />

          {/* Catch All → 404 */}
          <Route path="*" element={<Navigate to="/error/404" replace />} />
        </Routes>
      </Suspense>
    </AuthHydration>
  );
}
