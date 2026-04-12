import { NextResponse } from 'next/server';
import { clientOps } from '@/lib/db';
import { userOps } from '@/lib/db';
import type { ClientMetrics } from '@/types';

// GET all clients (filtered by logged-in dietitian)
export async function GET(request: Request) {
  try {
    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);
    const clients = await clientOps.getAll(dietitianId);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST new client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, metrics } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);
    const newClient = await clientOps.create(name, metrics as ClientMetrics, dietitianId);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
