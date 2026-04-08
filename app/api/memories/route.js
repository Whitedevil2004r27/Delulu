import { NextResponse } from 'next/server';

export function GET() {
    return NextResponse.json([
        { id: 1, date: "The Beginning", title: "Our First Talk", text: "When we first spoke, I didn't know how much you'd come to mean to me." },
        { id: 2, date: "The Spark", title: "That One Joke", text: "We laughed until it hurt. That was the moment everything felt different." },
        { id: 3, date: "The Realization", title: "Quiet Moments", text: "It's not just the exciting times, it's the quiet moments with you that I cherish." }
    ]);
}
