git adimport { readFileSync } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'openapi.yaml');
    const content = readFileSync(filePath, 'utf-8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/yaml',
      },
    });
  } catch (error) {
    console.error('Error reading OpenAPI specification:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to read OpenAPI specification' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
