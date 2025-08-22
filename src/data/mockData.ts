// Import all restaurant images
import biryaniHouseImg from '@/assets/restaurants/biryani-house.jpg';
import dosaCornerImg from '@/assets/restaurants/dosa-corner.jpg';
import tandoorExpressImg from '@/assets/restaurants/tandoor-express.jpg';
import chaatStreetImg from '@/assets/restaurants/chaat-street.jpg';
import pizzaPalaceImg from '@/assets/restaurants/pizza-palace.jpg';
import sweetTreatsImg from '@/assets/restaurants/sweet-treats.jpg';

// Import all food images
import chickenBiryaniImg from '@/assets/food/chicken-biryani.jpg';
import muttonBiryaniImg from '@/assets/food/mutton-biryani.jpg';
import vegBiryaniImg from '@/assets/food/veg-biryani.jpg';
import chicken65Img from '@/assets/food/chicken-65.jpg';
import raitaImg from '@/assets/food/raita.jpg';
import masalaDosaImg from '@/assets/food/masala-dosa.jpg';
import ravaDosaImg from '@/assets/food/rava-dosa.jpg';
import idliSambarImg from '@/assets/food/idli-sambar.jpg';
import vadaSambarImg from '@/assets/food/vada-sambar.jpg';
import filterCoffeeImg from '@/assets/food/filter-coffee.jpg';
import butterChickenImg from '@/assets/food/butter-chicken.jpg';
import paneerButterMasalaImg from '@/assets/food/paneer-butter-masala.jpg';
import garlicNaanImg from '@/assets/food/garlic-naan.jpg';
import tandooriChickenImg from '@/assets/food/tandoori-chicken.jpg';
import paniPuriImg from '@/assets/food/pani-puri.jpg';
import bhelPuriImg from '@/assets/food/bhel-puri.jpg';
import dahiPuriImg from '@/assets/food/dahi-puri.jpg';
import samosaImg from '@/assets/food/samosa.jpg';
import margheritaPizzaImg from '@/assets/food/margherita-pizza.jpg';
import chickenSupremeImg from '@/assets/food/chicken-supreme.jpg';
import garlicBreadImg from '@/assets/food/garlic-bread.jpg';
import gulabJamunImg from '@/assets/food/gulab-jamun.jpg';
import rasMalaiImg from '@/assets/food/ras-malai.jpg';
import chocolateBrownieImg from '@/assets/food/chocolate-brownie.jpg';
import kulfiImg from '@/assets/food/kulfi.jpg';

export interface Restaurant {
  id: number;
  name: string;
  rating: number;
  eta: string;
  image: string;
  cuisine: string;
  location: string;
  menu: MenuItemData[];
}

export interface MenuItemData {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isVeg: boolean;
  isSpicy: boolean;
}

export const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "Biryani House",
    rating: 4.5,
    eta: "30-40 min",
    image: biryaniHouseImg,
    cuisine: "North Indian, Biryani",
    location: "Banjara Hills",
    menu: [
      {
        id: 101,
        name: "Chicken Biryani",
        price: 299,
        description: "Aromatic basmati rice cooked with tender chicken pieces and exotic spices",
        image: chickenBiryaniImg,
        category: "Biryani",
        isVeg: false,
        isSpicy: true
      },
      {
        id: 102,
        name: "Mutton Biryani",
        price: 399,
        description: "Rich and flavorful mutton pieces cooked with fragrant basmati rice",
        image: muttonBiryaniImg,
        category: "Biryani",
        isVeg: false,
        isSpicy: true
      },
      {
        id: 103,
        name: "Veg Biryani",
        price: 249,
        description: "Mixed vegetables and paneer cooked with aromatic basmati rice",
        image: vegBiryaniImg,
        category: "Biryani",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 104,
        name: "Chicken 65",
        price: 199,
        description: "Spicy and crispy chicken appetizer with curry leaves and green chilies",
        image: chicken65Img,
        category: "Starters",
        isVeg: false,
        isSpicy: true
      },
      {
        id: 105,
        name: "Raita",
        price: 79,
        description: "Cool and refreshing yogurt based side dish with cucumber",
        image: raitaImg,
        category: "Sides",
        isVeg: true,
        isSpicy: false
      }
    ]
  },
  {
    id: 2,
    name: "Dosa Corner",
    rating: 4.3,
    eta: "20-30 min",
    image: dosaCornerImg,
    cuisine: "South Indian",
    location: "Jubilee Hills",
    menu: [
      {
        id: 201,
        name: "Masala Dosa",
        price: 149,
        description: "Crispy rice crepe with spiced potato filling served with sambar and chutney",
        image: masalaDosaImg,
        category: "Dosa",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 202,
        name: "Rava Dosa",
        price: 169,
        description: "Thin and crispy semolina crepe with onions and coriander",
        image: ravaDosaImg,
        category: "Dosa",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 203,
        name: "Idli Sambar",
        price: 99,
        description: "Soft steamed rice cakes served with lentil curry and coconut chutney",
        image: idliSambarImg,
        category: "Breakfast",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 204,
        name: "Vada Sambar",
        price: 119,
        description: "Crispy lentil donuts served with spicy sambar and chutney",
        image: vadaSambarImg,
        category: "Breakfast",
        isVeg: true,
        isSpicy: true
      },
      {
        id: 205,
        name: "Filter Coffee",
        price: 59,
        description: "Authentic South Indian filter coffee made with chicory",
        image: filterCoffeeImg,
        category: "Beverages",
        isVeg: true,
        isSpicy: false
      }
    ]
  },
  {
    id: 3,
    name: "Tandoor Express",
    rating: 4.6,
    eta: "35-45 min",
    image: tandoorExpressImg,
    cuisine: "North Indian, Tandoor",
    location: "Gachibowli",
    menu: [
      {
        id: 301,
        name: "Butter Chicken",
        price: 329,
        description: "Tender chicken pieces in a rich tomato and cream based gravy",
        image: butterChickenImg,
        category: "Main Course",
        isVeg: false,
        isSpicy: false
      },
      {
        id: 302,
        name: "Paneer Butter Masala",
        price: 269,
        description: "Soft paneer cubes in a creamy tomato based curry",
        image: paneerButterMasalaImg,
        category: "Main Course",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 303,
        name: "Garlic Naan",
        price: 89,
        description: "Soft tandoor bread topped with fresh garlic and coriander",
        image: garlicNaanImg,
        category: "Breads",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 304,
        name: "Tandoori Chicken",
        price: 399,
        description: "Half chicken marinated in yogurt and spices, cooked in tandoor",
        image: tandooriChickenImg,
        category: "Tandoor",
        isVeg: false,
        isSpicy: true
      }
    ]
  },
  {
    id: 4,
    name: "Chaat Street",
    rating: 4.2,
    eta: "15-25 min",
    image: chaatStreetImg,
    cuisine: "Street Food, Chaat",
    location: "Ameerpet",
    menu: [
      {
        id: 401,
        name: "Pani Puri",
        price: 79,
        description: "Crispy hollow puris filled with spicy tangy water and chutneys",
        image: paniPuriImg,
        category: "Chaat",
        isVeg: true,
        isSpicy: true
      },
      {
        id: 402,
        name: "Bhel Puri",
        price: 89,
        description: "Puffed rice mixed with sev, chutneys and vegetables",
        image: bhelPuriImg,
        category: "Chaat",
        isVeg: true,
        isSpicy: true
      },
      {
        id: 403,
        name: "Dahi Puri",
        price: 99,
        description: "Crispy puris topped with yogurt, chutneys and sev",
        image: dahiPuriImg,
        category: "Chaat",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 404,
        name: "Samosa",
        price: 49,
        description: "Deep fried triangular pastry with spiced potato filling",
        image: samosaImg,
        category: "Snacks",
        isVeg: true,
        isSpicy: true
      }
    ]
  },
  {
    id: 5,
    name: "Pizza Palace",
    rating: 4.4,
    eta: "25-35 min",
    image: pizzaPalaceImg,
    cuisine: "Italian, Pizza",
    location: "Hitech City",
    menu: [
      {
        id: 501,
        name: "Margherita Pizza",
        price: 299,
        description: "Classic pizza with tomato sauce, mozzarella and fresh basil",
        image: margheritaPizzaImg,
        category: "Pizza",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 502,
        name: "Chicken Supreme",
        price: 449,
        description: "Loaded with chicken, bell peppers, onions and cheese",
        image: chickenSupremeImg,
        category: "Pizza",
        isVeg: false,
        isSpicy: false
      },
      {
        id: 503,
        name: "Garlic Bread",
        price: 149,
        description: "Crispy bread sticks with garlic butter and herbs",
        image: garlicBreadImg,
        category: "Sides",
        isVeg: true,
        isSpicy: false
      }
    ]
  },
  {
    id: 6,
    name: "Sweet Treats",
    rating: 4.7,
    eta: "20-30 min",
    image: sweetTreatsImg,
    cuisine: "Desserts, Sweets",
    location: "Kondapur",
    menu: [
      {
        id: 601,
        name: "Gulab Jamun",
        price: 89,
        description: "Soft milk dumplings soaked in rose flavored sugar syrup",
        image: gulabJamunImg,
        category: "Sweets",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 602,
        name: "Ras Malai",
        price: 129,
        description: "Spongy cottage cheese balls in sweetened milk",
        image: rasMalaiImg,
        category: "Sweets",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 603,
        name: "Chocolate Brownie",
        price: 149,
        description: "Rich and fudgy chocolate brownie with vanilla ice cream",
        image: chocolateBrownieImg,
        category: "Desserts",
        isVeg: true,
        isSpicy: false
      },
      {
        id: 604,
        name: "Kulfi",
        price: 79,
        description: "Traditional Indian ice cream flavored with cardamom and pistachios",
        image: kulfiImg,
        category: "Desserts",
        isVeg: true,
        isSpicy: false
      }
    ]
  }
];

export const foodCategories = [
  { name: "Biryani", icon: "🍛", color: "bg-orange-100" },
  { name: "Pizza", icon: "🍕", color: "bg-red-100" },
  { name: "Dosa", icon: "🥞", color: "bg-yellow-100" },
  { name: "Desserts", icon: "🍰", color: "bg-pink-100" },
  { name: "Tandoor", icon: "🍖", color: "bg-orange-100" },
  { name: "Chaat", icon: "🥙", color: "bg-green-100" },
  { name: "South Indian", icon: "🥥", color: "bg-blue-100" },
  { name: "Chinese", icon: "🥢", color: "bg-red-100" }
];