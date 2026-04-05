import { NextResponse } from 'next/server';
import { dietPlanOps } from '@/lib/db';

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

    const body = await request.json();
    const { meals } = body;

    if (!meals) {
      return NextResponse.json(
        { error: 'Meals data is required' },
        { status: 400 }
      );
    }

    const updated = dietPlanOps.update(id, meals);
    if (!updated) {
      return NextResponse.json(
        { error: 'Diet plan not found' },
        { status: 404 }
      );
    }

    const plan = dietPlanOps.getById(id);
    return NextResponse.json(plan);
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

    const deleted = dietPlanOps.delete(id);
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
