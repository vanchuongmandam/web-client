// scripts/generate-embeddings.js

// Sử dụng require cho một script chạy bằng node
const { embed } = require('@genkit-ai/ai/embedder');
const { textEmbedding004 } = require('@genkit-ai/googleai/embedder');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' }); // Để script có thể đọc MONGODB_URI

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
    // Tìm những bài viết chưa có trường 'contentVector'
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

            // Kết hợp tiêu đề và nội dung để có ngữ cảnh tốt hơn
            const textToEmbed = `Tiêu đề: ${article.title}\n\nNội dung: ${article.content}`;
            
            // Tạo embedding
            const embedding = await embed({
                embedder: textEmbedding004,
                content: textToEmbed,
            });

            // Cập nhật lại document trong MongoDB
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
