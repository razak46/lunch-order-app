import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Redis client setup
let redis;
try {
  const { createClient } = require('redis');
  redis = createClient({
    url: process.env.REDIS_URL,
  });
  redis.connect().catch(console.error);
} catch (error) {
  console.error('Redis connection error:', error);
}

// TTL for data (5 days)
const TTL_SECONDS = 5 * 24 * 60 * 60;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const menuData = await redis.get('current_menu');
    const menuItemsData = await redis.get('menu_items');

    if (menuData && menuItemsData) {
      return NextResponse.json({
        menu: menuData,
        menuItems: JSON.parse(menuItemsData),
      });
    }

    return NextResponse.json({ menu: null, menuItems: [] });
  } catch (error) {
    console.error('Error loading menu:', error);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, image, menu, menuItems } = body;

    if (action === 'analyze') {
      // AI analysis of menu image
      console.log('=== ANALYZE ACTION START ===');
      console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
      console.log('Image data length:', image?.length);
      
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Missing Anthropic API key');
        return NextResponse.json(
          { error: 'Anthropic API key not configured' },
          { status: 500 }
        );
      }

      if (!image) {
        console.error('Missing image data');
        return NextResponse.json(
          { error: 'Image data is required' },
          { status: 400 }
        );
      }

      try {
        console.log('Calling Anthropic API...');
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: image,
                  },
                },
                {
                  type: 'text',
                  text: `Analyzuj tento obrázek menu z restaurace. Vrať mi pouze JSON seznam jídel ve formátu:
[
  {"name": "Název jídla 1"},
  {"name": "Název jídla 2"}
]

Pravidla:
- Vrať POUZE čistý JSON array, bez jakéhokoliv dalšího textu
- Nezahrnuj ceny
- Nezahrnuj alergeny (čísla A1, A2, atd.)
- Použij správnou českou diakritiku
- Pokud je u jídla více variant (např. s rýží/nudlemi), zahrnuj obě jako samostatná jídla
- Seřaď jídla podle pořadí na menu

Vrať pouze JSON, nic víc.`,
                },
              ],
            },
          ],
        });

        console.log('Anthropic API response received');
        console.log('Response content:', message.content);

        // Extract text from Claude response
        const responseText = message.content[0].text;
        console.log('Response text:', responseText.substring(0, 200) + '...');
        
        // Try to parse JSON from response
        let menuItems;
        try {
          // Remove markdown code blocks if present
          const cleanedText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          console.log('Cleaned text:', cleanedText.substring(0, 200) + '...');
          
          menuItems = JSON.parse(cleanedText);
          console.log('Parsed menuItems:', menuItems);
          
          // Validate structure
          if (!Array.isArray(menuItems)) {
            throw new Error('Response is not an array');
          }
          
          // Ensure all items have name property
          menuItems = menuItems.map(item => ({
            name: typeof item === 'string' ? item : (item.name || 'Neznámé jídlo')
          }));
          
          console.log('Final menuItems count:', menuItems.length);
          
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text:', responseText);
          
          // Fallback: try to extract items manually
          const lines = responseText.split('\n').filter(line => line.trim());
          menuItems = lines
            .filter(line => !line.includes('{') && !line.includes('}') && !line.includes('[') && !line.includes(']'))
            .map(line => ({
              name: line.replace(/^[-*•]\s*/, '').replace(/^"\s*/, '').replace(/\s*"$/, '').trim()
            }))
            .filter(item => item.name.length > 0);
          
          console.log('Fallback menuItems count:', menuItems.length);
        }

        console.log('=== ANALYZE ACTION END ===');
        console.log('Returning menuItems:', JSON.stringify(menuItems));
        return NextResponse.json({ menuItems });
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        console.error('Error stack:', aiError.stack);
        return NextResponse.json(
          { error: 'Failed to analyze menu: ' + aiError.message },
          { status: 500 }
        );
      }
    }

    if (action === 'confirm') {
      // Save menu to Redis
      if (!redis) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      try {
        await redis.set('current_menu', menu, { EX: TTL_SECONDS });
        await redis.set('menu_items', JSON.stringify(menuItems), { EX: TTL_SECONDS });
        return NextResponse.json({ success: true });
      } catch (redisError) {
        console.error('Redis save error:', redisError);
        return NextResponse.json(
          { error: 'Failed to save menu to database' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    if (!redis) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    await redis.del('current_menu');
    await redis.del('menu_items');
    await redis.del('orders');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 });
  }
}
