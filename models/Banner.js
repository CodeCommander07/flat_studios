import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: false },
    message: { type: String, default: "" },
    linkText: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    icon: { type: String, default: "circle-check-big" },
    bgColor: { type: String, default: "#1b4332" },
    textColor: { type: String, default: "#ffffff" },
  },
  { _id: false }
);

const BannerConfigSchema = new mongoose.Schema(
  {
    displayMode: {
      type: String,
      enum: ["stack", "rotate"],
      default: "rotate",
    },
    banners: {
      type: [BannerSchema],
      default: [
        {}, // slot 1
        {}, // slot 2
        {}, // slot 3
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.models.BannerConfig ||
  mongoose.model("BannerConfig", BannerConfigSchema);
