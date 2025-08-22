import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category: string;
  restaurantId: number;
  restaurantName: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getPlatformFee: () => number;
  getTaxes: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: MenuItem) => {
        const items = get().items;
        const existingItem = items.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
          set({
            items: items.map(cartItem =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            )
          });
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }]
          });
        }
      },

      removeItem: (itemId: number) => {
        set({
          items: get().items.filter(item => item.id !== itemId)
        });
      },

      updateQuantity: (itemId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? 40 : 0; // ₹40 delivery fee
      },

      getPlatformFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? Math.round(subtotal * 0.02) : 0; // 2% platform fee
      },

      getTaxes: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? Math.round(subtotal * 0.05) : 0; // 5% GST
      },

      getTotalPrice: () => {
        const subtotal = get().getSubtotal();
        const deliveryFee = get().getDeliveryFee();
        const platformFee = get().getPlatformFee();
        const taxes = get().getTaxes();
        return subtotal + deliveryFee + platformFee + taxes;
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);