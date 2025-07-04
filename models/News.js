import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    editor: { type: String, required: true },
    date: { type: Date, default: Date.now },
    tags: { type: [String], default: [] },
});

export default mongoose.models.News || mongoose.model('News', NewsSchema);
