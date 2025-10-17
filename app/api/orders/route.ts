import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const ORDERS_KEY = 'lunch:orders';
const TTL_SECONDS = 5 * 24 * 60 * 60; // 5 dní

export async function GET() {
  try {
    const orders = await kv.get(ORDERS_KEY);
    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { order } = await request.json();
    
    // Získání současných objednávek
    const orders: any[] = (await kv.get(ORDERS_KEY)) || [];
    
    // Přidání nové objednávky
    orders.push(order);
    
    // Uložení s TTL
    await kv.set(ORDERS_KEY, orders, { ex: TTL_SECONDS });
    
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    
    if (orderId) {
      // Smazání konkrétní objednávky
      const orders: any[] = (await kv.get(ORDERS_KEY)) || [];
      const updatedOrders = orders.filter(o => o.id !== parseInt(orderId));
      await kv.set(ORDERS_KEY, updatedOrders, { ex: TTL_SECONDS });
    } else {
      // Smazání všech objednávek
      await kv.del(ORDERS_KEY);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting orders:', error);
    return NextResponse.json({ error: 'Failed to delete orders' }, { status: 500 });
  }
}
