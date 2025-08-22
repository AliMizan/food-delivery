import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore, UserRole } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Utensils, Car, Store } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuthStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(loginForm.email, loginForm.password, selectedRole);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      
      // Redirect based on role
      switch (selectedRole) {
        case 'customer':
          navigate('/customer/home');
          break;
        case 'restaurant':
          navigate('/restaurant/dashboard');
          break;
        case 'rider':
          navigate('/rider/dashboard');
          break;
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(signupForm.email, signupForm.password, signupForm.name, selectedRole);
      toast({
        title: "Account created!",
        description: "Welcome to FoodFiesta! Your account has been created successfully.",
      });
      
      // Redirect based on role
      switch (selectedRole) {
        case 'customer':
          navigate('/customer/home');
          break;
        case 'restaurant':
          navigate('/restaurant/dashboard');
          break;
        case 'rider':
          navigate('/rider/dashboard');
          break;
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'customer' as UserRole,
      label: 'Customer',
      description: 'Order delicious food',
      icon: Utensils,
      color: 'text-primary'
    },
    {
      value: 'restaurant' as UserRole,
      label: 'Restaurant',
      description: 'Manage your restaurant',
      icon: Store,
      color: 'text-secondary'
    },
    {
      value: 'rider' as UserRole,
      label: 'Delivery Rider',
      description: 'Deliver orders',
      icon: Car,
      color: 'text-accent'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-orange-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🍽️</span>
            </div>
            <span className="text-3xl font-bold bg-orange-gradient bg-clip-text text-transparent">
              FoodFiesta
            </span>
          </div>
          <p className="text-muted-foreground">Your favorite food delivery app</p>
        </div>

        <Card className="shadow-card-hover border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">I am a:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          selectedRole === role.value
                            ? 'border-primary bg-primary/5 shadow-food'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 mx-auto mb-1 ${role.color}`} />
                        <div className="text-xs font-medium">{role.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="food"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="food"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;