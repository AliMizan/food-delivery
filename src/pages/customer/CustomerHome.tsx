import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { restaurants, foodCategories } from '@/data/mockData';
import Navbar from '@/components/ui/navbar';

const CustomerHome = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || restaurant.cuisine.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-orange-gradient bg-clip-text text-transparent">
            Craving something delicious?
          </h1>
          <p className="text-xl text-muted-foreground">
            Order from your favorite restaurants and get it delivered fast!
          </p>
        </div>

        {/* Search Tabs */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <Tabs defaultValue="food" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                <TabsTrigger value="food">Search Food</TabsTrigger>
                <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                <TabsTrigger value="nearby">Near Me</TabsTrigger>
              </TabsList>
              
              <TabsContent value="food" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search for biryani, pizza, dosa..."
                    className="pl-10 h-12 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="restaurants" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search restaurants..."
                    className="pl-10 h-12 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="nearby" className="space-y-4">
                <div className="flex items-center justify-center p-8 text-center">
                  <div className="space-y-4">
                    <MapPin className="w-12 h-12 mx-auto text-primary" />
                    <h3 className="text-lg font-semibold">Find restaurants near you</h3>
                    <p className="text-muted-foreground">Enable location to see nearby restaurants</p>
                    <Button variant="food">Enable Location</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Food Categories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">What's on your mind?</h2>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {foodCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-card-hover ${
                  selectedCategory === category.name
                    ? 'bg-primary text-primary-foreground shadow-food'
                    : `${category.color} hover:bg-primary/10`
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="text-sm font-medium">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Restaurants */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {selectedCategory ? `${selectedCategory} Restaurants` : 'All Restaurants'}
            </h2>
            {selectedCategory && (
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                Clear Filter
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Link key={restaurant.id} to={`/customer/restaurant/${restaurant.id}`}>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:scale-105 border-0 shadow-card">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {restaurant.eta}
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{restaurant.rating}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {restaurant.location}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or removing filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;