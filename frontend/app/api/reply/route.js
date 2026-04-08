import { NextResponse } from 'next/server';

export async function POST(req) {
    const { answer } = await req.json();
    console.log(`\n💖 DELULU HAS REPLIED: "${answer.toUpperCase()}" at ${new Date().toLocaleString()} 💖\n`);
    return NextResponse.json({ success: true, message: "Response recorded!" });
}
