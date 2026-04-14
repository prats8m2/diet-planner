import { NextResponse } from 'next/server';
import { dietPlanOps, clientOps } from '@/lib/db';

// POST new diet plan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, weekStart, meals } = body;

    if (!clientId || !weekStart || !meals) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);

    // Get the client
    const client = await clientOps.getById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If client doesn't have a dietitian_id, update it to the current user
    if (client.dietitian_id === null || client.dietitian_id === undefined) {
      await clientOps.update(clientId, client.name, client.metrics, dietitianId);
    }
    // Verify the client belongs to this dietitian
    else if (client.dietitian_id !== dietitianId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const newPlan = await dietPlanOps.create(clientId, weekStart, meals);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating diet plan:', error);
    return NextResponse.json(
      { error: 'Failed to create diet plan' },
      { status: 500 }
    );
  }
}
