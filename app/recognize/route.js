import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Remove data URL prefix if present
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data
              }
            },
            {
              type: 'text',
              text: `Analyzuj toto menu a vrať JSON seznam jídel. 

DŮLEŽITÉ: Odpověz POUZE validním JSON objektem, žádný jiný text.

Formát:
{
  "items": [
    {"name": "Název jídla", "price": "Cena"},
    {"name": "Název jídla 2", "price": "Cena"}
  ]
}

Pravidla:
- Pouze JSON, žádné markdown, žádné backticky
- Zahrň všechna hlavní jídla
- Ceny ve formátu "120 Kč" nebo "150,-"
- Pokud cena není uvedena, dej prázdný string`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to recognize menu',
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const menuData = JSON.parse(responseText);
    
    return NextResponse.json({ items: menuData.items || [] });
    
  } catch (error) {
    console.error('Error in recognize API:', error);
    return NextResponse.json({ 
      error: 'Failed to process image',
      details: error.message 
    }, { status: 500 });
  }
}
