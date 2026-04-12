import { NextResponse } from 'next/server';
import { userOps } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, pin } = await request.json();

    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required' }, { status: 400 });
    }

    const user = await userOps.authenticate(username, pin);

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
