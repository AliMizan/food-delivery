import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Login from "./pages/Login";
import CustomerHome from "./pages/customer/CustomerHome";
import RestaurantPage from "./pages/customer/RestaurantPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import FloatingCart from "./components/FloatingCart";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* Customer Routes */}
          <Route 
            path="/customer/home" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerHome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/restaurant/:id" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RestaurantPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/cart" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CartPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/checkout" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CheckoutPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Placeholder routes for other roles */}
          <Route 
            path="/restaurant/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['restaurant']}>
                <RestaurantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rider/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['rider']}>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Rider Dashboard (Coming Soon)</h1>
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Floating Cart - only show on customer routes */}
        <FloatingCart />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
