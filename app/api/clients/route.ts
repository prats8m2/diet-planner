import { NextResponse } from 'next/server';
import { clientOps } from '@/lib/db';
import type { ClientMetrics } from '@/types';

// GET all clients
export async function GET() {
  try {
    const clients = clientOps.getAll();
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

    const newClient = clientOps.create(name, metrics as ClientMetrics);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
