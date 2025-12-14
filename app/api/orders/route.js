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
    
    let parsedOrders = orders ? JSON.parse(orders) : [];
    
    // Ensure all orders have an id (for backwards compatibility)
    let needsUpdate = false;
    parsedOrders = parsedOrders.map((order, index) => {
      if (!order.id) {
        needsUpdate = true;
        return { ...order, id: `legacy-${index}-${Date.now()}` };
      }
      return order;
    });
    
    // Save back if we added ids
    if (needsUpdate && parsedOrders.length > 0) {
      await client.set('orders', JSON.stringify(parsedOrders), {
        EX: TTL_SECONDS
      });
    }
    
    return NextResponse.json({ orders: parsedOrders });
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
    
    // Find order by id
    const orderIndex = orders.findIndex(o => o.id === updatedOrder.id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Update only this specific order
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

// Delete a single order by id
export async function DELETE(request) {
  let client;
  try {
    client = await getRedisClient();
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const ordersData = await client.get('orders');
    let orders = ordersData ? JSON.parse(ordersData) : [];
    
    // Find the order to delete
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
