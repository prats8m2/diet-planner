import { NextResponse } from 'next/server';
import { dietPlanOps } from '@/lib/db';

// GET all diet plans for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = parseInt((await params).id);
    const plans = await dietPlanOps.getByClient(clientId);
    const activePlan = await dietPlanOps.getActiveByClient(clientId);

    // Mark which plan is active
    const plansWithStatus = plans.map(plan => ({
      ...plan,
      is_active: activePlan?.id === plan.id
    }));

    return NextResponse.json(plansWithStatus);
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    return NextResponse.json({ error: 'Failed to fetch diet plans' }, { status: 500 });
  }
}

// PATCH to activate/deactivate a plan
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { action, planId } = await request.json();

    if (action === 'activate') {
      const plan = await dietPlanOps.getById(parseInt(planId));
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      const success = await dietPlanOps.activatePlan(parseInt(planId), plan.client_id);
      if (success) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
    }

    if (action === 'deactivate') {
      const success = await dietPlanOps.deactivatePlan(parseInt(planId));
      if (success) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Failed to deactivate plan' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating diet plan:', error);
    return NextResponse.json({ error: 'Failed to update diet plan' }, { status: 500 });
  }
}
