import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "ml_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const ex = prev.find((p) => p.product_id === product.id);
      if (ex) {
        return prev.map((p) =>
          p.product_id === product.id ? { ...p, quantity: p.quantity + quantity } : p,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price_myr: product.price_myr,
          quantity,
          image_url: product.image_url,
          brand: product.brand,
        },
      ];
    });
  };

  const updateQty = (product_id, quantity) => {
    setItems((prev) =>
      prev
        .map((p) => (p.product_id === product_id ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0),
    );
  };

  const removeItem = (product_id) =>
    setItems((prev) => prev.filter((p) => p.product_id !== product_id));

  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price_myr * i.quantity, 0);
    const delivery_fee = items.length === 0 ? 0 : subtotal >= 300 ? 0 : 15;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      delivery_fee,
      total: Number((subtotal + delivery_fee).toFixed(2)),
      count: items.reduce((s, i) => s + i.quantity, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
