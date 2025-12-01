
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Item, Customer } from '@/lib/types';

interface OrderItem extends Item {
  orderQuantity: number;
}

export interface HeldOrder {
  id: string;
  items: OrderItem[];
  customerName: string;
  customerId: string;
  otherCharges: number;
  overallDiscount: number;
  date: string;
}

interface HoldContextType {
  heldOrders: HeldOrder[];
  holdOrder: (order: Omit<HeldOrder, 'id' | 'date'>) => void;
  loadOrder: (orderId: string) => HeldOrder | undefined;
  deleteOrder: (orderId: string) => void;
  currentHold: HeldOrder | null;
  clearCurrentHold: () => void;
}

const HoldContext = createContext<HoldContextType | undefined>(undefined);

export const HoldProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [currentHold, setCurrentHold] = useState<HeldOrder | null>(null);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('heldOrders');
      if (storedOrders) {
        setHeldOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error("Failed to load held orders from localStorage", error);
    }
  }, []);

  const updateLocalStorage = (orders: HeldOrder[]) => {
    try {
      localStorage.setItem('heldOrders', JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to save held orders to localStorage", error);
    }
  };

  const holdOrder = useCallback((order: Omit<HeldOrder, 'id' | 'date'>) => {
    const newOrder: HeldOrder = {
      ...order,
      id: `hold-${Date.now()}`,
      date: new Date().toISOString(),
    };
    const newOrders = [...heldOrders, newOrder];
    setHeldOrders(newOrders);
    updateLocalStorage(newOrders);
    toast({ title: "Order Held", description: "The current order has been saved to the hold list." });
  }, [heldOrders, toast]);

  const loadOrder = useCallback((orderId: string) => {
    const orderToLoad = heldOrders.find(o => o.id === orderId);
    if (orderToLoad) {
      setCurrentHold(orderToLoad);
      const remainingOrders = heldOrders.filter(o => o.id !== orderId);
      setHeldOrders(remainingOrders);
      updateLocalStorage(remainingOrders);
      toast({ title: "Order Loaded", description: "The held order has been loaded into the cart." });
      return orderToLoad;
    }
    return undefined;
  }, [heldOrders, toast]);

  const clearCurrentHold = useCallback(() => {
    setCurrentHold(null);
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    const updatedOrders = heldOrders.filter(o => o.id !== orderId);
    setHeldOrders(updatedOrders);
    updateLocalStorage(updatedOrders);
    toast({ title: "Order Removed", description: "The held order has been removed." });
  }, [heldOrders, toast]);
  

  return (
    <HoldContext.Provider value={{ heldOrders, holdOrder, loadOrder, deleteOrder, currentHold, clearCurrentHold }}>
      {children}
    </HoldContext.Provider>
  );
};

export const useHold = (): HoldContextType => {
  const context = useContext(HoldContext);
  if (context === undefined) {
    throw new Error('useHold must be used within a HoldProvider');
  }
  return context;
};
