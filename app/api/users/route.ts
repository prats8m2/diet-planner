import { NextResponse } from 'next/server';
import { userOps } from '@/lib/db';

// GET all users
export async function GET() {
  try {
    const users = await userOps.getAll();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST new user (dietitian)
export async function POST(request: Request) {
  try {
    const { username, pin, full_name } = await request.json();

    if (!username || !pin || !full_name) {
      return NextResponse.json({ error: 'Username, PIN, and full name are required' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const newUser = await userOps.create(username, pin, full_name);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user. Username may already exist.' }, { status: 500 });
  }
}
