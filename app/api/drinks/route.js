import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const TTL_SECONDS = 5 * 24 * 60 * 60;

async function getRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL
  });
  await client.connect();
  return client;
}

export async function GET() {
  let client;
  try {
    client = await getRedisClient();
    const orders = await client.get('orders');
    
    return NextResponse.json({ 
      orders: orders ? JSON.parse(orders) : [] 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

export async function POST(request) {
  let client;
  try {
    client = await getRedisClient();
    const order = await request.json();
    
    const ordersData = await client.get('orders');
    const orders = ordersData ? JSON.parse(ordersData) : [];
    orders.push(order);
    
    await client.set('orders', JSON.stringify(orders), {
      EX: TTL_SECONDS
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}
