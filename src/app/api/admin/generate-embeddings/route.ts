/*

import { NextRequest, NextResponse } from 'next/server';
import { embed } from '@genkit-ai/ai/embedder';
import { googleAI } from '@genkit-ai/googleai';
import { MongoClient } from 'mongodb';

// Lấy embedder từ plugin
const embedder = googleAI().embedder('text-embedding-004');

export async function POST(req: NextRequest) {
    // --- 1. Bảo mật Endpoint ---
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // So sánh với một mã bí mật. Hãy đổi mã này trong môi trường thực tế.
    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 2. Kết nối MongoDB ---
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        return NextResponse.json({ error: 'MONGODB_URI is not defined' }, { status: 500 });
    }
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        const db = client.db('vanchuongmandam');
        const articlesCollection = db.collection('articles');

        // --- 3. Lấy bài viết cần xử lý ---
        const articlesToProcess = await articlesCollection.find({ 
            contentVector: { $exists: false } 
        }).toArray();

        if (articlesToProcess.length === 0) {
            return NextResponse.json({ message: 'All articles have already been processed.' });
        }

        let processedCount = 0;
        // --- 4. Tạo Embeddings và Cập nhật ---
        for (const article of articlesToProcess) {
            const textToEmbed = `Title: ${article.title}\n\nContent: ${article.content}`;
            
            const embedding = await embed({
                embedder: embedder,
                content: textToEmbed,
            });

            await articlesCollection.updateOne(
                { _id: article._id },
                { $set: { contentVector: embedding } }
            );
            processedCount++;
        }

        return NextResponse.json({
            message: `Successfully generated embeddings for ${processedCount} articles.`,
            processedCount: processedCount,
        });

    } catch (error: any) {
        console.error('Failed to generate embeddings:', error);
        return NextResponse.json({ error: 'Failed to generate embeddings', details: error.message }, { status: 500 });
    } finally {
        await client.close();
    }
}
*/