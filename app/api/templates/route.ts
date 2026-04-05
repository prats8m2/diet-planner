import { NextResponse } from 'next/server';
import { templateOps } from '@/lib/db';

// GET all templates
export async function GET() {
  try {
    const templates = templateOps.getAll();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST new template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, meals } = body;

    if (!name || !meals) {
      return NextResponse.json(
        { error: 'Name and meals are required' },
        { status: 400 }
      );
    }

    const newTemplate = templateOps.create(name, meals);
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
