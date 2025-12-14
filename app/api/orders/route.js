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
    
    // Add unique ID to order
    order.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const ordersData = await client.get('orders');
    const orders = ordersData ? JSON.parse(ordersData) : [];
    orders.push(order);
    
    await client.set('orders', JSON.stringify(orders), {
      EX: TTL_SECONDS
    });
    
    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

// Update an existing order
export async function PUT(request) {
  let client;
  try {
    client = await getRedisClient();
    const updatedOrder = await request.json();
    
    const ordersData = await client.get('orders');
    let orders = ordersData ? JSON.parse(ordersData) : [];
    
    // Find and update the order
    const orderIndex = orders.findIndex(o => o.id === updatedOrder.id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    orders[orderIndex] = updatedOrder;
    
    await client.set('orders', JSON.stringify(orders), {
      EX: TTL_SECONDS
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

// Delete an order
export async function DELETE(request) {
  let client;
  try {
    client = await getRedisClient();
    const { id } = await request.json();
    
    const ordersData = await client.get('orders');
    let orders = ordersData ? JSON.parse(ordersData) : [];
    
    // Filter out the order to delete
    const originalLength = orders.length;
    orders = orders.filter(o => o.id !== id);
    
    if (orders.length === originalLength) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    await client.set('orders', JSON.stringify(orders), {
      EX: TTL_SECONDS
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}
