import { NextResponse } from 'next/server';
import { dietPlanOps } from '@/lib/db';

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

    const newPlan = dietPlanOps.create(clientId, weekStart, meals);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating diet plan:', error);
    return NextResponse.json(
      { error: 'Failed to create diet plan' },
      { status: 500 }
    );
  }
}
