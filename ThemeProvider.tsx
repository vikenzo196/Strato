import type { Accessory } from './mockProducts';

export type OrderStatus = 'in_attesa' | 'accettato' | 'completato';
export interface OrderLine {
  productId: string; name: string; color: string; thumb: string;
  basePrice: number; accessories: Accessory[]; lineTotal: number;
}
export interface Order {
  id: string; customer: string; date: string; status: OrderStatus;
  total: number; lines: OrderLine[];
}

import { mockProducts } from './mockProducts';
const thumbOf = (id: string) => mockProducts.find(p => p.id === id)!.thumb;

export const mockOrders: Order[] = [
  {
    id: 'ORD-2026-014',
    customer: 'Vincenzo Manna',
    date: '26 giu 2026',
    status: 'in_attesa',
    total: 25,
    lines: [
      { productId: 'vaso-2', name: 'Vaso 2', color: 'Giallo', thumb: thumbOf('vaso-2'),
        basePrice: 10, accessories: [
          { id: 'satinata', label: 'Finitura satinata', price: 2 },
          { id: 'incisione', label: 'Incisione nome', price: 3 },
        ], lineTotal: 15 },
      { productId: 'vaso', name: 'Vaso', color: 'Bianco', thumb: thumbOf('vaso'),
        basePrice: 10, accessories: [], lineTotal: 10 },
    ],
  },
];

export const ORDER_TABS: { id: OrderStatus | 'tutti'; label: string }[] = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'in_attesa', label: 'Da accettare' },
  { id: 'accettato', label: 'Accettati' },
  { id: 'completato', label: 'Completati' },
];
