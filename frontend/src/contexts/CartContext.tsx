import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CraftObject, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (object: CraftObject, quantity?: number) => void;
  removeFromCart: (objectId: string) => void;
  updateQuantity: (objectId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  totalAmount: number;
  platformFeeTotal: number;
  taxTotal: number;
  directArtisanTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'kaarigar_cart_v1';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const addToCart = (object: CraftObject, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.object.id === object.id);
      if (existing) {
        return prev.map((item) =>
          item.object.id === object.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { object, quantity, addedAt: Date.now() }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (objectId: string) => {
    setCart((prev) => prev.filter((item) => item.object.id !== objectId));
  };

  const updateQuantity = (objectId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(objectId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.object.id === objectId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // Rate breakdown: Artisan price + 5% platform fee + 5% tax (GST)
  const PLATFORM_FEE_RATE = 0.05;
  const TAX_RATE = 0.05;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const directArtisanTotal = cart.reduce(
    (sum, item) => sum + item.object.price * item.quantity,
    0
  );
  const platformFeeTotal = cart.reduce(
    (sum, item) => sum + Math.round(item.object.price * PLATFORM_FEE_RATE) * item.quantity,
    0
  );
  const taxTotal = cart.reduce(
    (sum, item) => sum + Math.round(item.object.price * TAX_RATE) * item.quantity,
    0
  );
  const totalAmount = directArtisanTotal + platformFeeTotal + taxTotal;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        totalAmount,
        platformFeeTotal,
        taxTotal,
        directArtisanTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
