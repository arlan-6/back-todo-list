import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a note"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    content: {
      type: Array,
      of: Object,
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Note", NoteSchema);
