import mongoose from 'mongoose';

const OperatorRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  discordTag: { type: String, required: true },
  selectedCompany: { type: String, required: true },
  routeSubmissionType: { type: String, enum: ['new', 'change'], required: true },

  // Page 3 questions (generic keys)
  P3Q1: { type: String, required: true },  // route number
  P3Q2: { type: String, required: true },
  P3Q3: { type: String },
  P3Q4: { type: String, required: true },
  P3Q5: { type: String, required: true },

  // We will store the filename or URL for the uploaded map
mapFile: {
    data: Buffer,
    contentType: String,
    filename: String,
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'denied'],
    default: 'pending',
  },

  createdAt: { type: Date, default: Date.now },
});

// To prevent model overwrite in dev with hot reloads:
export default mongoose.models.OperatorRequest || mongoose.model('OperatorRequest', OperatorRequestSchema);
