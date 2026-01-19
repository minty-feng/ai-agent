import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { id: 'ch1', title: 'Two Sum', difficulty: 'Easy' },
    { id: 'ch2', title: 'LRU Cache', difficulty: 'Medium' }
  ]);
}
