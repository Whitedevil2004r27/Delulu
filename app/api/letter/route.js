import { NextResponse } from 'next/server';

export function GET() {
    return NextResponse.json({
        hero: {
            label: "A little something from the heart",
            heading: "For My Delulu",
            subtitle: "Because some feelings do not need a label to be real"
        },
        letter: {
            paragraphs: [
                "Hey Delulu,",
                "I do not fully know what to call this feeling. Love? Friendship? Maybe it is something in between that does not need a name to feel absolutely real.",
                "Every time we talk something in me feels lighter. You make the ordinary feel warmer. You make me happy in a way I cannot quite explain and honestly I do not want to.",
                "So here is my honest question the one I have been carrying quietly. Are you here for me always?",
                "Because I am. Always."
            ],
            signature: "- Ravi"
        },
        always: {
            text: "Always.",
            subText: "Whatever this is it is beautiful"
        },
        footer: {
            textLine1: "Made with quiet love",
            textLine2: "Ravi to Delulu"
        }
    });
}
