/* eslint-disable consistent-return */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('productsOnCart');
      if (data) {
        setProducts([...JSON.parse(data)]);
      }
    }

    loadProducts();
  }, []);
  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });
      setProducts(newProducts);

      await AsyncStorage.setItem('productsOnCart', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity - 1 };
          }
          return product;
        })
        .filter(product => product.quantity > 0);
      setProducts(newProducts);
      await AsyncStorage.setItem('productsOnCart', JSON.stringify(newProducts));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productAlreadyOnCart = products.find(p => p.id === product.id);
      if (productAlreadyOnCart) {
        return increment(product.id);
      }

      const productsOnCart = [...products, { ...product, quantity: 1 }];

      setProducts(productsOnCart);

      await AsyncStorage.setItem('productsOnCart', JSON.stringify(products));
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
