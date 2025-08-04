// scripts/generate-embeddings.mjs

import { embed } from '@genkit-ai/ai/embedder';
import { googleAI } from '@genkit-ai/googleai'; // Import plugin chính
import { MongoClient } from 'mongodb';
import 'dotenv/config'; // Sử dụng 'dotenv/config' cho ES modules

// Lấy model embedder từ plugin
const embedder = googleAI().embedder('text-embedding-004');

async function main() {
    // --- 1. Kết nối đến MongoDB ---
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vanchuongmandam';
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not defined in your environment variables.");
    }
    const client = new MongoClient(mongoUri);
    
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Successfully connected.");
    
    const db = client.db('vanchuongmandam');
    const articlesCollection = db.collection('articles');

    // --- 2. Lấy các bài viết chưa được xử lý ---
    const articlesToProcess = await articlesCollection.find({ 
        contentVector: { $exists: false } 
    }).toArray();

    if (articlesToProcess.length === 0) {
        console.log("All articles have already been processed. No new embeddings to generate.");
        await client.close();
        return;
    }

    console.log(`Found ${articlesToProcess.length} new articles to process...`);

    // --- 3. Tạo Embeddings và Cập nhật ---
    for (const article of articlesToProcess) {
        try {
            console.log(`Processing article: "${article.title}"`);

            const textToEmbed = `Title: ${article.title}\n\nContent: ${article.content}`;
            
            const embedding = await embed({
                embedder: embedder, // Sử dụng embedder đã được lấy đúng cách
                content: textToEmbed,
            });

            await articlesCollection.updateOne(
                { _id: article._id },
                { $set: { contentVector: embedding } }
            );

            console.log(`  -> Successfully created and stored embedding for "${article.title}".`);

        } catch (error) {
            console.error(`  -> Failed to process article "${article.title}":`, error);
        }
    }

    // --- 4. Đóng kết nối ---
    console.log("Finished processing all new articles.");
    await client.close();
}

main().catch(console.error);
