import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ solved: 42, total: 120 });
}
