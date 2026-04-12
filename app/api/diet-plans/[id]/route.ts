import { NextResponse } from 'next/server';
import { dietPlanOps, clientOps } from '@/lib/db';

// PUT update diet plan
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid diet plan ID' }, { status: 400 });
    }

    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);

    // Verify the plan belongs to a client of this dietitian
    const plan = await dietPlanOps.getById(id);
    if (!plan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    const client = await clientOps.getById(plan.client_id);
    if (!client || client.dietitian_id !== dietitianId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { meals } = body;

    if (!meals) {
      return NextResponse.json(
        { error: 'Meals data is required' },
        { status: 400 }
      );
    }

    const updated = await dietPlanOps.update(id, meals);
    if (!updated) {
      return NextResponse.json(
        { error: 'Diet plan not found' },
        { status: 404 }
      );
    }

    const updatedPlan = await dietPlanOps.getById(id);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating diet plan:', error);
    return NextResponse.json(
      { error: 'Failed to update diet plan' },
      { status: 500 }
    );
  }
}

// DELETE diet plan
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid diet plan ID' }, { status: 400 });
    }

    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);

    // Verify the plan belongs to a client of this dietitian
    const plan = await dietPlanOps.getById(id);
    if (!plan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    const client = await clientOps.getById(plan.client_id);
    if (!client || client.dietitian_id !== dietitianId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const deleted = await dietPlanOps.delete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Diet plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete diet plan' },
      { status: 500 }
    );
  }
}
