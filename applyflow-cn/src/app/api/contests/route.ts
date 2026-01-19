import { NextResponse } from 'next/server';

export async function GET() {
  const now = Date.now();
  return NextResponse.json([
    { id: 'c1', name: 'Monthly Contest', startAt: new Date(now + 86400000).toISOString() },
    { id: 'c2', name: 'Weekly Sprint', startAt: new Date(now + 3 * 86400000).toISOString() }
  ]);
}
