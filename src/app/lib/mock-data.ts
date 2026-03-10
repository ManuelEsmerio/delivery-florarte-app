export type OrderStatus = 'assigned' | 'in_route' | 'delivered' | 'failed';

export interface OrderItem {
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryNotes?: string;
  lat: number;
  lng: number;
  senderName: string;
  senderPhone: string;
  hasCard?: boolean;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-8821',
    customerName: 'Alice Johnson',
    phone: '+1 (555) 123-4567',
    address: '123 Pine St, San Francisco, CA 94103',
    deliveryDate: '2024-05-20',
    deliveryTime: '02:00 PM - 04:00 PM',
    status: 'assigned',
    items: [
      { name: 'Auriculares Inalámbricos', quantity: 1, imageUrl: 'https://picsum.photos/seed/headphones/200/200' },
      { name: 'Cable USB-C', quantity: 2, imageUrl: 'https://picsum.photos/seed/cable/200/200' }
    ],
    deliveryNotes: 'Por favor, dejar en la recepción.',
    lat: 37.7749,
    lng: -122.4194,
    senderName: 'Tech Store Central',
    senderPhone: '+1 (555) 000-9999',
    hasCard: true
  },
  {
    id: '2',
    orderNumber: 'ORD-8822',
    customerName: 'Bob Smith',
    phone: '+1 (555) 987-6543',
    address: '456 Oak Ave, Oakland, CA 94612',
    deliveryDate: '2024-05-20',
    deliveryTime: '04:00 PM - 06:00 PM',
    status: 'in_route',
    items: [
      { name: 'Teclado Mecánico', quantity: 1, imageUrl: 'https://picsum.photos/seed/keyboard/200/200' }
    ],
    lat: 37.8044,
    lng: -122.2711,
    senderName: 'Logistics Hub North',
    senderPhone: '+1 (555) 888-7777',
    hasCard: false
  },
  {
    id: '3',
    orderNumber: 'ORD-8823',
    customerName: 'Charlie Davis',
    phone: '+1 (555) 000-1111',
    address: '789 Maple Dr, Berkeley, CA 94704',
    deliveryDate: '2024-05-20',
    deliveryTime: '01:00 PM - 03:00 PM',
    status: 'delivered',
    items: [
      { name: 'Mouse Gamer', quantity: 1, imageUrl: 'https://picsum.photos/seed/mouse/200/200' },
      { name: 'Mouse Pad', quantity: 1, imageUrl: 'https://picsum.photos/seed/mousepad/200/200' }
    ],
    lat: 37.8715,
    lng: -122.2730,
    senderName: 'Gaming World Express',
    senderPhone: '+1 (555) 444-3333',
    hasCard: true
  }
];
