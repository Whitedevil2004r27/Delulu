import { NextResponse } from 'next/server';
import siteContent from '../../siteContent.json';

export function GET() {
    return NextResponse.json(siteContent);
}
