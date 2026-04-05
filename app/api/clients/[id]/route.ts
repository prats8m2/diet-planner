import { NextResponse } from 'next/server';
import { clientOps, dietPlanOps } from '@/lib/db';

// GET client by ID with their diet plan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const client = clientOps.getById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get the latest diet plan for this client
    const dietPlan = dietPlanOps.getLatestByClient(id);

    return NextResponse.json({ client, dietPlan });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT update client
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, metrics } = body;

    const updated = clientOps.update(id, name, metrics);
    if (!updated) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clientOps.getById(id);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE client
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const deleted = clientOps.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
