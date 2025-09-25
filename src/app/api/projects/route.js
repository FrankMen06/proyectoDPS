import { NextResponse } from 'next/server';
import { list, create } from '@/lib/db';

export async function GET() {
    return NextResponse.json(list('projects'));
}

export async function POST(request) {
    const body = await request.json();
    const created = create('projects', body);
    return NextResponse.json(created, { status: 201 });
}
