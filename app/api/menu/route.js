import { kv } from 'redis';
import { NextResponse } from 'next/server';

const TTL_SECONDS = 5 * 24 * 60 * 60; // 5 days

export async function GET() {
  try {
    const menu = await kv.get('current-menu');
    const orders = await kv.get('orders') || [];
    
    return NextResponse.json({ 
      menu: menu || null,
      orders: orders 
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    await kv.set('current-menu', body, { ex: TTL_SECONDS });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await kv.del('current-menu');
    await kv.del('orders');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 });
  }
}
