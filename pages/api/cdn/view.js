import dbConnect from '@/utils/db';
import UserFile from '@/models/UserFile';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { fileId, userId } = req.query;
    if (!fileId || !userId) {
        return res.status(400).json({ error: 'Missing fileId or userId' });
    }

    try {
        await dbConnect();

        const fileDoc = await UserFile.findOne({ _id: fileId, userId }).select('data contentType filename');
        if (!fileDoc || !fileDoc.data) {
            return res.status(404).json({ error: 'File not found' });
        }

        const ext = path.extname(fileDoc.filename).toLowerCase();

        // If the file is a Google Docs-viewable format
        const viewableExtensions = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf'];
        if (viewableExtensions.includes(ext)) {
            // 1. Convert the file buffer to a base64 string and embed in a data URL (bad idea for large files), OR:
            // 2. Store the file temporarily and generate a shareable URL
            // We'll choose Option 2 via a temp route

            const tempId = `${fileId}_${Date.now()}`;

            // Save it to a temporary cache (e.g., in-memory map or Redis, if using that)
            global.tempFileCache = global.tempFileCache || new Map();
            global.tempFileCache.set(tempId, {
                data: fileDoc.data,
                filename: fileDoc.filename,
                contentType: fileDoc.contentType,
                expiresAt: Date.now() + 5 * 60 * 1000, // expires in 5 min
            });

            const fileURL = `${process.env.BASE_URL}/api/cdn/temp-file?key=${tempId}`;
            const googleDocsURL = `https://docs.google.com/gview?url=${encodeURIComponent(fileURL)}&embedded=true`;

            return res.redirect(302, googleDocsURL);
        }

        const rawName = fileDoc.filename || 'file';
        const displayName = rawName.replace(/^.*?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/, '');
        res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${displayName}"`);
        return res.status(200).send(fileDoc.data);
    } catch (error) {
        console.error('Error serving user file:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
