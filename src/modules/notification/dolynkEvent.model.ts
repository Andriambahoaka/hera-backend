import mongoose, { Schema } from "mongoose";

/**
 * Ids of Dolynk webhook events already received.
 *
 * Dolynk's signature only covers the event `id`, so a captured event could be
 * re-sent with other fields changed. Recording each id and refusing repeats
 * blocks both plain replays and tampered replays.
 */
export const DOLYNK_EVENT_RETENTION_DAYS = 30;

interface IDolynkEvent {
  _id: string;
  receivedAt: Date;
}

const dolynkEventSchema = new Schema<IDolynkEvent>(
  {
    _id: { type: String, required: true },
    receivedAt: {
      type: Date,
      default: Date.now,
      expires: DOLYNK_EVENT_RETENTION_DAYS * 24 * 60 * 60,
    },
  },
  { versionKey: false }
);

export default mongoose.model<IDolynkEvent>("DolynkEvent", dolynkEventSchema);
