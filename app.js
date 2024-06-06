import express from "express";
import mongoose from "mongoose";
import schedule from "node-schedule";
import noteModel from "./models/note.js";
import cors from "cors";

import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({
  project: "superb-app-425312-p5",
  location: "us-central1",
});
const model = "gemini-1.5-flash-001";

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 7408,
    temperature: 2,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
  systemInstruction: {
    parts: [
      {
        type: "text",
        content:
          "Return a response in the format: { title: 'Title', description: 'Description', content: [{ type: 'text' or 'checkbox', text: 'text here', checked: false, unChecker: false }] }",
      },
    ],
  },
});

async function generateContent() {
  const req = {
    contents: [
      { role: "user", parts: [{ text: `write daily tasks for a student` }] },
    ],
  };

  const streamingResp = await generativeModel.generateContentStream(req);

  for await (const item of streamingResp.stream) {
    process.stdout.write("stream chunk: " + JSON.stringify(item) + "\n");
  }

  process.stdout.write(
    "aggregated response: " + JSON.stringify(await streamingResp.response)
  );
}

// generateContent();

const unCheck = async () => {
  const filter = {
    "content.unChecker": true, // Ensure this matches your requirement
  };

  const update = {
    $set: {
      "content.$[element].checked": false,
    },
  };

  const arrayFilters = [{ "element.unChecker": true }];

  try {
    const result = await noteModel.updateMany(filter, update, { arrayFilters });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};

// Schedule the job to run every day at midnight
schedule.scheduleJob("0 0 * * *", () => {
  console.log("uncheck");
  unCheck();
});
// unCheck();
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
const allowedOrigins = [
  // "https://to-do-list-five-fawn-34.vercel.app",
  "http://localhost:5173",
];
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
