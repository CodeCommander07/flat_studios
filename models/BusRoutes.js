import mongoose from 'mongoose';

const BusRoutesSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  operator: { type: [String], required: true, default: [] },
  number: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  stops: {
    forward: { type: [String], default: [] },
    backward: { type: [String], default: [] },
  },
  description: { type: String },

  // 🚧 Diversion details
  diversion: {
    active: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    stops: { type: [String], default: [] }, // affected stops or altered route
  },

  map: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
});

export default mongoose.models.BusRoutes ||
  mongoose.model('BusRoutes', BusRoutesSchema);
