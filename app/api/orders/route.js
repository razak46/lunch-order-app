import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const TTL_SECONDS = 5 * 24 * 60 * 60; // 5 days

export async function GET() {
  try {
    const orders = await kv.get('orders') || [];
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const order = await request.json();
    
    const orders = await kv.get('orders') || [];
    orders.push(order);
    
    await kv.set('orders', orders, { ex: TTL_SECONDS });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}
