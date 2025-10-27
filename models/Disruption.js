import mongoose from 'mongoose';

const DisruptionSchema = new mongoose.Schema({
  incidentId: { type: String, unique: true, required: true },
  incidentName: { type: String, required: true },
  incidentDescription: { type: String, required: true },
  affectedStops: { type: [String], required: true },
  affectedRoutes: { type: [String], required: true },
  incidentType: { type: String, required: true },
  incidentDate: { type: Date, default: Date.now },
  incidentUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Disruption || mongoose.model('Disruption', DisruptionSchema);
