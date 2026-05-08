import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
    try {
        const newContent = await req.json();
        const filePath = path.join(process.cwd(), 'app', 'siteContent.json');
        
        // Read current content
        const currentContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Update with new values
        const updatedContent = {
            ...currentContent,
            ...newContent
        };
        
        // Write back
        fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2));
        
        return NextResponse.json({ success: true, message: 'Content updated successfully' });
    } catch (error) {
        console.error('Error updating content:', error);
        return NextResponse.json({ success: false, message: 'Failed to update content' }, { status: 500 });
    }
}