import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'customer':
          navigate('/customer/home');
          break;
        case 'restaurant':
          navigate('/restaurant/dashboard');
          break;
        case 'rider':
          navigate('/rider/dashboard');
          break;
        default:
          navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/5 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-16 h-16 bg-orange-gradient rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-3xl">🍽️</span>
          </div>
          <span className="text-5xl font-bold bg-orange-gradient bg-clip-text text-transparent">
            FoodFiesta
          </span>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Delicious food,
            <br />
            <span className="bg-orange-gradient bg-clip-text text-transparent">
              delivered fast
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Order from your favorite restaurants and get fresh, hot food delivered to your doorstep
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            variant="food" 
            size="lg" 
            className="text-lg px-8"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground">
            Join thousands of happy customers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
