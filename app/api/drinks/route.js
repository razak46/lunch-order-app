import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const DEFAULT_DRINKS = [
  { id: 1, name: "0,3 malina", active: true, seasonal: false },
  { id: 2, name: "0,5 malina", active: true, seasonal: false },
  { id: 3, name: "0,3 bezinka", active: true, seasonal: false },
  { id: 4, name: "0,5 bezinka", active: true, seasonal: false },
  { id: 5, name: "0,3 kofola", active: true, seasonal: false },
  { id: 6, name: "0,5 kofola", active: true, seasonal: false },
  { id: 7, name: "Jemně perlivá voda", active: true, seasonal: false },
  { id: 8, name: "mojito 0,3", active: true, seasonal: false },
  { id: 9, name: "mojito 0,5", active: true, seasonal: false },
];

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
    const drinks = await client.get('drinks');
    
    // If no drinks exist, initialize with defaults
    if (!drinks) {
      await client.set('drinks', JSON.stringify(DEFAULT_DRINKS));
      return NextResponse.json({ drinks: DEFAULT_DRINKS });
    }
    
    return NextResponse.json({ drinks: JSON.parse(drinks) });
  } catch (error) {
    console.error('Error fetching drinks:', error);
    return NextResponse.json({ error: 'Failed to fetch drinks' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

export async function POST(request) {
  let client;
  try {
    client = await getRedisClient();
    const { drinks } = await request.json();
    
    await client.set('drinks', JSON.stringify(drinks));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving drinks:', error);
    return NextResponse.json({ error: 'Failed to save drinks' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}

export async function DELETE(request) {
  let client;
  try {
    client = await getRedisClient();
    const { id } = await request.json();
    
    const drinksData = await client.get('drinks');
    let drinks = drinksData ? JSON.parse(drinksData) : DEFAULT_DRINKS;
    
    drinks = drinks.filter(drink => drink.id !== id);
    
    await client.set('drinks', JSON.stringify(drinks));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting drink:', error);
    return NextResponse.json({ error: 'Failed to delete drink' }, { status: 500 });
  } finally {
    if (client) await client.disconnect();
  }
}
