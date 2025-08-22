import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, Minus, ArrowLeft, Leaf, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { restaurants } from '@/data/mockData';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/ui/navbar';

const RestaurantPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const restaurant = restaurants.find(r => r.id === parseInt(id || '0'));

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Restaurant not found</h1>
          <Button onClick={() => navigate('/customer/home')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const categories = [...new Set(restaurant.menu.map(item => item.category))];
  const filteredMenu = selectedCategory 
    ? restaurant.menu.filter(item => item.category === selectedCategory)
    : restaurant.menu;

  const getItemQuantity = (itemId: number) => {
    const cartItem = items.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (menuItem: any) => {
    addItem({
      ...menuItem,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    });
    
    toast({
      title: "Added to cart!",
      description: `${menuItem.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/customer/home')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Restaurant Header */}
        <Card className="shadow-card border-0">
          <div className="relative">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-lg opacity-90">{restaurant.cuisine}</p>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">{restaurant.rating}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.eta}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.location}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "food" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "food" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-4">
          {filteredMenu.map((item) => {
            const quantity = getItemQuantity(item.id);
            
            return (
              <Card key={item.id} className="shadow-card border-0 hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            {item.isVeg && <Leaf className="w-4 h-4 text-green-500" />}
                            {item.isSpicy && <Flame className="w-4 h-4 text-red-500" />}
                          </div>
                          <p className="text-muted-foreground text-sm">{item.description}</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg text-primary">₹{item.price}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2">
                        {quantity > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => useCartStore.getState().updateQuantity(item.id, quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => useCartStore.getState().updateQuantity(item.id, quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="food"
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMenu.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">No items in this category</h3>
            <p className="text-muted-foreground">Try selecting a different category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;