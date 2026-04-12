import { NextResponse } from 'next/server';
import { dietPlanOps, clientOps } from '@/lib/db';

// GET all diet plans for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);
    const clientId = parseInt((await params).id);

    // Verify the client belongs to this dietitian
    const client = await clientOps.getById(clientId);
    if (!client || client.dietitian_id !== dietitianId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

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
    // Get dietitian ID from session
    const authHeader = request.headers.get('x-user-id');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dietitianId = parseInt(authHeader);
    const clientId = parseInt((await params).id);

    // Verify the client belongs to this dietitian
    const client = await clientOps.getById(clientId);
    if (!client || client.dietitian_id !== dietitianId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { action, planId } = await request.json();

    if (action === 'activate') {
      const plan = await dietPlanOps.getById(parseInt(planId));
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Verify the plan belongs to the client
      if (plan.client_id !== clientId) {
        return NextResponse.json({ error: 'Plan not found for this client' }, { status: 404 });
      }

      const success = await dietPlanOps.activatePlan(parseInt(planId), plan.client_id);
      if (success) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
    }

    if (action === 'deactivate') {
      const plan = await dietPlanOps.getById(parseInt(planId));
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Verify the plan belongs to the client
      if (plan.client_id !== clientId) {
        return NextResponse.json({ error: 'Plan not found for this client' }, { status: 404 });
      }

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
