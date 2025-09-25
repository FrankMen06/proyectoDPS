export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getById, patch, replace, remove } from '@/lib/db';

export async function GET(_, { params }) {
    const item = getById('tasks', params.id);
    if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
}

export async function PATCH(request, { params }) {
    const updates = await request.json();
    const updated = patch('tasks', params.id, updates);
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
}

export async function PUT(request, { params }) {
    const nextObj = await request.json();
    const updated = replace('tasks', params.id, nextObj);
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
}

export async function DELETE(_, { params }) {
    const ok = remove('tasks', params.id);
    if (!ok) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({}, { status: 204 });
}
