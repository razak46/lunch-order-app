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
    
    const menu = await client.get('current-menu');
    const orders = await client.get('orders');
    
    return NextResponse.json({ 
      menu: menu ? JSON.parse(menu) : null,
      orders: orders ? JSON.parse(orders) : []
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

export async function POST(request) {
  let client;
  try {
    client = await getRedisClient();
    const body = await request.json();
    
    await client.set('current-menu', JSON.stringify(body), {
      EX: TTL_SECONDS
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

export async function DELETE() {
  let client;
  try {
    client = await getRedisClient();
    
    await client.del('current-menu');
    await client.del('orders');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}
