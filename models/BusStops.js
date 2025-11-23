import mongoose from 'mongoose';

const BusStopsSchema = new mongoose.Schema(
  {
    stopId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    town: { type: String, required: true },
    facilities: { type: [String], default: [] },
    routes: { type: [String], default: [] }, // route _ids or routeId strings
    branding: { type: String },
    notes: { type: String },
    postcode: { type: String },
    closed: { type: Boolean, default: false },
    closureReason: { type: String },
    tempStopId: { type: String, default: '' }, // replacement stopId, if any
    location: { type: String }, // optional, if you use it in UI
  },
  { timestamps: true }
);

export default mongoose.models.BusStops ||
  mongoose.model('BusStops', BusStopsSchema);
