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

        const officeDocs = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf'];
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];

        const rawName = fileDoc.filename || 'file';
        const displayName = rawName.replace(/^.*?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/, '');

        // === Serve through Google Docs if Office doc ===
        if (officeDocs.includes(ext)) {
            const tempId = `${fileId}_${Date.now()}`;
            global.tempFileCache = global.tempFileCache || new Map();
            global.tempFileCache.set(tempId, {
                data: fileDoc.data,
                filename: displayName,
                contentType: fileDoc.contentType,
                expiresAt: Date.now() + 5 * 60 * 1000,
            });

            const fileURL = `${process.env.BASE_URL}/api/cdn/temp-file?key=${tempId}`;
            const googleDocsURL = `https://docs.google.com/gview?url=${encodeURIComponent(fileURL)}&embedded=true`;
            return res.redirect(302, googleDocsURL);
        }

        // === Serve image inline ===
        if (imageExts.includes(ext)) {
            res.setHeader('Content-Type', fileDoc.contentType || 'image/png');
            res.setHeader('Content-Disposition', `inline; filename="${displayName}"`);
            return res.status(200).send(fileDoc.data);
        }

        // === Default fallback: force download ===
        res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${displayName}"`);
        return res.status(200).send(fileDoc.data);

    } catch (error) {
        console.error('Error serving user file:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
