import { NextResponse } from 'next/server';
import { clientOps, dietPlanOps } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-user-id');
    const dietitianId = authHeader ? parseInt(authHeader) : null;

    const results: {
      currentDietitianId: number | null;
      authHeader: string | null;
      client3: { id: number; name: string; dietitian_id: number | undefined; hasDietitianId: boolean; metrics: any } | string | null;
      client3DietitianId: number | undefined | null;
      allClients: Array<{ id: number; name: string; dietitian_id: number | undefined; hasDietitianId: boolean }> | string;
      client3Plans?: Array<{ id: number; client_id: number; week_start: string; created_at: string }> | string;
      updateSuccess?: boolean;
      updatedDietitianId?: number;
      updatedClient?: { id: number | undefined; dietitian_id: number | undefined } | null;
      updateError?: string;
    } = {
      currentDietitianId: dietitianId,
      authHeader: authHeader,
      client3: null,
      client3DietitianId: null,
      allClients: []
    };

    // Check client ID 3
    try {
      const client3 = await clientOps.getById(3);
      if (client3) {
        results.client3 = {
          id: client3.id,
          name: client3.name,
          dietitian_id: client3.dietitian_id,
          hasDietitianId: client3.dietitian_id !== null && client3.dietitian_id !== undefined,
          metrics: client3.metrics
        };
        results.client3DietitianId = client3.dietitian_id;
      } else {
        results.client3 = "Client not found";
      }
    } catch (error) {
      results.client3 = `Error: ${error}`;
    }

    // Get all clients to see their dietitian_ids
    try {
      const allClients = await clientOps.getAll();
      results.allClients = allClients.map(c => ({
        id: c.id,
        name: c.name,
        dietitian_id: c.dietitian_id,
        hasDietitianId: c.dietitian_id !== null && c.dietitian_id !== undefined
      }));
    } catch (error) {
      results.allClients = `Error: ${error}`;
    }

    // Test update client 3 with dietitian_id
    if (results.client3 && typeof results.client3 === 'object' && dietitianId) {
      try {
        await clientOps.update(3, results.client3.name, results.client3.metrics || {}, dietitianId);
        results.updateSuccess = true;
        results.updatedDietitianId = dietitianId;

        // Verify the update
        const updatedClient = await clientOps.getById(3);
        results.updatedClient = {
          id: updatedClient?.id,
          dietitian_id: updatedClient?.dietitian_id
        };
      } catch (error) {
        results.updateError = `Error updating: ${error}`;
      }
    }

    // Get all diet plans for client 3
    try {
      const plans = await dietPlanOps.getByClient(3);
      results.client3Plans = plans.map(p => ({
        id: p.id,
        client_id: p.client_id,
        week_start: p.week_start,
        created_at: p.created_at
      }));
    } catch (error) {
      results.client3Plans = `Error: ${error}`;
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
