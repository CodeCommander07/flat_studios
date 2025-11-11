import mongoose from 'mongoose';

const TicketHandlerSchema = new mongoose.Schema({
  subject: { type: String, required: true, unique: true },
  handler: { type: String, default: null }, // e.g. "User.Obi"
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.TicketHandler || mongoose.model('TicketHandler', TicketHandlerSchema);
