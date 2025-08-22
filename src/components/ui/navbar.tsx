import { ShoppingCart, User, MapPin, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const Navbar = () => {
  const location = useLocation();
  const { getTotalItems } = useCartStore();
  const { user, logout } = useAuthStore();
  const totalItems = getTotalItems();

  const isCustomerRoute = location.pathname.startsWith('/customer');

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🍽️</span>
          </div>
          <span className="text-2xl font-bold bg-orange-gradient bg-clip-text text-transparent">
            FoodFiesta
          </span>
        </Link>

        {/* Search bar for customer routes */}
        {isCustomerRoute && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search for restaurants, food..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* Location for customer */}
              {isCustomerRoute && (
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">Your Location</span>
                </Button>
              )}

              {/* Cart icon for customer */}
              {isCustomerRoute && (
                <Link to="/customer/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* User menu */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;