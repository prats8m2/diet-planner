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

    // Get dietitian ID from session if available
    const authHeader = request.headers.get('x-user-id');
    const dietitianId = authHeader ? parseInt(authHeader) : null;

    const client = await clientOps.getById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If client doesn't have a dietitian_id and we have a current user, assign them
    if (dietitianId && (client.dietitian_id === null || client.dietitian_id === undefined)) {
      const updatedClient = await clientOps.update(id, client.name, client.metrics, dietitianId);
      if (updatedClient) {
        // Use the updated client with dietitian_id
        return NextResponse.json({ client: updatedClient, dietPlan });
      }
    }

    // Get the latest diet plan for this client
    const dietPlan = await dietPlanOps.getLatestByClient(id);

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

    const updated = await clientOps.update(id, name, metrics);
    if (!updated) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
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

    const deleted = await clientOps.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
