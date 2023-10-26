import express from "express";
import mongoose from "mongoose";

import noteModel from "./models/note.js";
import cors from "cors";

mongoose
  .connect(
    "mongodb+srv://arlanhan1997:1234@cluster0.zzfb7xu.mongodb.net/notes?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("db connected");
  })
  .catch((e) => {
    console.log("Error connecting to database:", e);
  });

const app = express();
const allowedOrigins = ["https://to-do-list-five-fawn-34.vercel.app"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());

app.post("/note", async (req, res) => {
  try {
    const newNote = new noteModel({
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
    });

    const note = await newNote.save();

    res.json(note);
  } catch {
    res.status(500).send("Server error");
  }
});
app.get("/note", async (req, res) => {
  try {
    const notes = await noteModel.find();
    res.json(notes);
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});
app.get("/note/:id", async (req, res) => {
  try {
    const note = await noteModel.findById({ _id: req.params.id });
    if (!note) {
      return res.status(404).json({ msg: "No note found" });
    }
    res.json(note);
  } catch (err) {
    res.status(500).send("server error");
  }
});
app.patch("/note/:id", async (req, res) => {
  try {
    const updatedNotes = await noteModel.updateOne(
      { _id: req.params.id },
      { $set: { ...req.body } }
    );
    res.json(updatedNotes);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
app.delete("/note/:id", async (req, res) => {
  try {
    const deletedNotes = await noteModel.deleteOne({ _id: req.params.id });
    res.json(deletedNotes);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

app.listen(1010, () => {
  console.log("server start");
});

export default app;
