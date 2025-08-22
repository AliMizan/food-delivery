import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  TrendingUp, 
  ShoppingBag, 
  Clock,
  DollarSign,
  Users,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/ui/navbar';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  preparationTime: number;
}

interface Order {
  id: number;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  orderTime: string;
  estimatedTime: number;
}

const RestaurantDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data - in real app, this would come from API
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: 1,
      name: "Chicken Biryani",
      description: "Aromatic basmati rice cooked with tender chicken pieces and exotic spices",
      price: 299,
      category: "Biryani",
      image: "/api/placeholder/300/200",
      isVeg: false,
      isSpicy: true,
      isAvailable: true,
      preparationTime: 25
    },
    {
      id: 2,
      name: "Paneer Butter Masala",
      description: "Soft paneer cubes in a creamy tomato based curry",
      price: 269,
      category: "Main Course",
      image: "/api/placeholder/300/200",
      isVeg: true,
      isSpicy: false,
      isAvailable: true,
      preparationTime: 15
    },
    {
      id: 3,
      name: "Margherita Pizza",
      description: "Classic pizza with tomato sauce, mozzarella and fresh basil",
      price: 299,
      category: "Pizza",
      image: "/api/placeholder/300/200",
      isVeg: true,
      isSpicy: false,
      isAvailable: false,
      preparationTime: 20
    }
  ]);

  const [orders] = useState<Order[]>([
    {
      id: 1001,
      customerName: "John Doe",
      items: [
        { name: "Chicken Biryani", quantity: 2, price: 299 },
        { name: "Raita", quantity: 1, price: 79 }
      ],
      total: 677,
      status: 'pending',
      orderTime: '10:30 AM',
      estimatedTime: 25
    },
    {
      id: 1002,
      customerName: "Jane Smith",
      items: [
        { name: "Paneer Butter Masala", quantity: 1, price: 269 },
        { name: "Garlic Naan", quantity: 2, price: 89 }
      ],
      total: 447,
      status: 'preparing',
      orderTime: '10:45 AM',
      estimatedTime: 15
    },
    {
      id: 1003,
      customerName: "Mike Johnson",
      items: [
        { name: "Margherita Pizza", quantity: 1, price: 299 }
      ],
      total: 299,
      status: 'ready',
      orderTime: '11:00 AM',
      estimatedTime: 0
    }
  ]);

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    isVeg: false,
    isSpicy: false,
    isAvailable: true,
    preparationTime: 15
  });

  const categories = [...new Set(menuItems.map(item => item.category))];
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.description || !newItem.price || !newItem.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const item: MenuItem = {
      id: Date.now(),
      name: newItem.name!,
      description: newItem.description!,
      price: newItem.price!,
      category: newItem.category!,
      image: "/api/placeholder/300/200",
      isVeg: newItem.isVeg!,
      isSpicy: newItem.isSpicy!,
      isAvailable: newItem.isAvailable!,
      preparationTime: newItem.preparationTime!
    };

    setMenuItems([...menuItems, item]);
    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: '',
      isVeg: false,
      isSpicy: false,
      isAvailable: true,
      preparationTime: 15
    });
    setIsAddItemOpen(false);
    
    toast({
      title: "Item added successfully!",
      description: `${item.name} has been added to your menu.`,
    });
  };

  const handleEditItem = () => {
    if (!selectedItem) return;

    setMenuItems(menuItems.map(item => 
      item.id === selectedItem.id ? selectedItem : item
    ));
    setIsEditItemOpen(false);
    setSelectedItem(null);
    
    toast({
      title: "Item updated successfully!",
      description: `${selectedItem.name} has been updated.`,
    });
  };

  const handleDeleteItem = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    toast({
      title: "Item deleted",
      description: "The item has been removed from your menu.",
    });
  };

  const toggleItemAvailability = (id: number) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
            <p className="text-muted-foreground">Manage your restaurant efficiently</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Needs attention
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{Math.round(avgOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    +3% from yesterday
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.orderTime}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold">₹{order.total}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-6">
            {/* Menu Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search menu items..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button variant="food">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Describe your dish..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        placeholder="e.g., Main Course"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prepTime">Preparation Time (min)</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        value={newItem.preparationTime}
                        onChange={(e) => setNewItem({ ...newItem, preparationTime: Number(e.target.value) })}
                        placeholder="15"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isVeg"
                          checked={newItem.isVeg}
                          onCheckedChange={(checked) => setNewItem({ ...newItem, isVeg: checked })}
                        />
                        <Label htmlFor="isVeg">Vegetarian</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isSpicy"
                          checked={newItem.isSpicy}
                          onCheckedChange={(checked) => setNewItem({ ...newItem, isSpicy: checked })}
                        />
                        <Label htmlFor="isSpicy">Spicy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isAvailable"
                          checked={newItem.isAvailable}
                          onCheckedChange={(checked) => setNewItem({ ...newItem, isAvailable: checked })}
                        />
                        <Label htmlFor="isAvailable">Available</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="food" onClick={handleAddItem}>
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="shadow-card border-0">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Badge variant={item.isAvailable ? "default" : "secondary"}>
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-primary">₹{item.price}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item);
                              setIsEditItemOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleItemAvailability(item.id)}
                          >
                            {item.isAvailable ? (
                              <EyeOff className="w-4 h-4 mr-2" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Prep: {item.preparationTime} min
                      </span>
                      <div className="flex space-x-1">
                        {item.isVeg && <Badge variant="outline" className="text-green-600">Veg</Badge>}
                        {item.isSpicy && <Badge variant="outline" className="text-red-600">Spicy</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Item Dialog */}
            <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                </DialogHeader>
                {selectedItem && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Item Name *</Label>
                      <Input
                        id="edit-name"
                        value={selectedItem.name}
                        onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price (₹) *</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        value={selectedItem.price}
                        onChange={(e) => setSelectedItem({ ...selectedItem, price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={selectedItem.description}
                        onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Input
                        id="edit-category"
                        value={selectedItem.category}
                        onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-prepTime">Preparation Time (min)</Label>
                      <Input
                        id="edit-prepTime"
                        type="number"
                        value={selectedItem.preparationTime}
                        onChange={(e) => setSelectedItem({ ...selectedItem, preparationTime: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-isVeg"
                          checked={selectedItem.isVeg}
                          onCheckedChange={(checked) => setSelectedItem({ ...selectedItem, isVeg: checked })}
                        />
                        <Label htmlFor="edit-isVeg">Vegetarian</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-isSpicy"
                          checked={selectedItem.isSpicy}
                          onCheckedChange={(checked) => setSelectedItem({ ...selectedItem, isSpicy: checked })}
                        />
                        <Label htmlFor="edit-isSpicy">Spicy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-isAvailable"
                          checked={selectedItem.isAvailable}
                          onCheckedChange={(checked) => setSelectedItem({ ...selectedItem, isAvailable: checked })}
                        />
                        <Label htmlFor="edit-isAvailable">Available</Label>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="food" onClick={handleEditItem}>
                    Update Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-semibold">Order #{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{order.total}</p>
                            <p className="text-sm text-muted-foreground">{order.orderTime}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {order.status === 'pending' && `Est. ${order.estimatedTime} min`}
                            {order.status === 'preparing' && `${order.estimatedTime} min remaining`}
                            {order.status === 'ready' && 'Ready for pickup'}
                          </div>
                          <div className="space-x-2">
                            {order.status === 'pending' && (
                              <Button size="sm" variant="food">
                                Accept Order
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button size="sm" variant="food">
                                Mark Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button size="sm" variant="outline">
                                Mark Delivered
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {menuItems.slice(0, 5).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-lg text-muted-foreground">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">₹{item.price}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Math.floor(Math.random() * 50) + 10} orders</p>
                          <p className="text-sm text-muted-foreground">This week</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.5</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Order Acceptance Rate</span>
                      <span className="font-semibold">98%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Prep Time</span>
                      <span className="font-semibold">18 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Satisfaction</span>
                      <span className="font-semibold">4.7/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RestaurantDashboard;