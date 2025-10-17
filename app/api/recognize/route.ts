import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image, mediaType } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { error: 'Chybí obrázek' }, 
        { status: 400 }
      );
    }

    // Volání Claude API z backend (bezpečné, žádný CORS problém)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image
              }
            },
            {
              type: 'text',
              text: `Extract ALL menu items from this restaurant menu image.

IMPORTANT INSTRUCTIONS:
- Read ALL visible text carefully, including Czech text
- Each menu item should include: number, soup, main dish, side dish, and price
- Example: "Menu 1 - Hovězí vývař, nudle, kuřecí řízek, bramborová kaše (140 Kč)"
- Include COMPLETE descriptions with all details visible in the image
- Return ONLY a valid JSON array, nothing else
- Format: [{"name": "complete dish name with all details"}]

DO NOT include markdown formatting, code blocks, explanations, or any text outside the JSON array.
Return the raw JSON array only.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error:', errorText);
      return NextResponse.json(
        { error: `Claude API chyba: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extrakce textu z Claude odpovědi
    let responseText = data.content[0].text;
    
    // Odstranění markdown formátování
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parsování JSON
    try {
      const menuItems = JSON.parse(responseText);
      return NextResponse.json({ menuItems });
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Response:', responseText);
      return NextResponse.json(
        { error: 'Nepodařilo se parsovat odpověď z AI', rawResponse: responseText }, 
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: error.message || 'Neznámá chyba serveru' }, 
      { status: 500 }
    );
  }
}
