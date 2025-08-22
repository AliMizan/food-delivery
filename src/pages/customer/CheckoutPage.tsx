import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Wallet, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/ui/navbar';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    items, 
    getSubtotal,
    getDeliveryFee,
    getPlatformFee,
    getTaxes,
    getTotalPrice,
    clearCart
  } = useCartStore();

  const [address, setAddress] = useState({
    house: '',
    area: '',
    landmark: '',
    city: 'Hyderabad',
    pincode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const platformFee = getPlatformFee();
  const taxes = getTaxes();
  const total = getTotalPrice();

  const handlePlaceOrder = async () => {
    if (!address.house || !address.area || !address.pincode) {
      toast({
        title: "Incomplete address",
        description: "Please fill in all required address fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    clearCart();
    
    toast({
      title: "Order placed successfully! 🎉",
      description: "Your order will be delivered in 30-40 minutes.",
    });
    
    navigate('/customer/home');
    setIsProcessing(false);
  };

  if (items.length === 0) {
    navigate('/customer/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/customer/cart')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="house">House/Flat No. *</Label>
                    <Input
                      id="house"
                      placeholder="e.g., 123, ABC Apartments"
                      value={address.house}
                      onChange={(e) => setAddress({ ...address, house: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area/Locality *</Label>
                    <Input
                      id="area"
                      placeholder="e.g., Banjara Hills"
                      value={address.area}
                      onChange={(e) => setAddress({ ...address, area: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    placeholder="e.g., Near Metro Station"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g., 500034"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center cursor-pointer flex-1">
                      <Wallet className="w-4 h-4 mr-2" />
                      UPI
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center cursor-pointer flex-1">
                      <Clock className="w-4 h-4 mr-2" />
                      Cash on Delivery
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Order Items */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Order Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bill Details */}
            <Card className="shadow-card border-0 sticky top-24">
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Item Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST & Restaurant Charges</span>
                    <span>₹{taxes}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>To Pay</span>
                    <span className="text-primary">₹{total}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  variant="food" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Pay ₹${total}`}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;