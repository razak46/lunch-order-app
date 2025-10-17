import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const MENU_KEY = 'lunch:menu';
const MENU_IMAGE_KEY = 'lunch:menu:image';
const TTL_SECONDS = 3 * 24 * 60 * 60; // 3 dny

export async function GET() {
  try {
    const menu = await kv.get(MENU_KEY);
    const image = await kv.get(MENU_IMAGE_KEY);
    
    return NextResponse.json({ 
      menu: menu || [], 
      image: image || null 
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { menu, image } = await request.json();
    
    // Uložení menu s TTL (automatické smazání po 3 dnech)
    await kv.set(MENU_KEY, menu, { ex: TTL_SECONDS });
    
    if (image) {
      await kv.set(MENU_IMAGE_KEY, image, { ex: TTL_SECONDS });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await kv.del(MENU_KEY);
    await kv.del(MENU_IMAGE_KEY);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 });
  }
}
