import express from "express";
import mongoose from "mongoose";
import schedule from "node-schedule";
import noteModel from "./models/note.js";
import cors from "cors";

const unCheck = async () => {
  // const notes = await noteModel.find();
  // const updated = notes.map((note) => {
  //   const content = note.content.map((i) => {
  //     i.checked = false;
  //     // console.log(i.checked);
  //     return i;
  //   });
  //   note.content = content
  //   return note
  // });
  const filter = {
    "content.unChecker": false,
  };

  // Define the update to set "unChecker" to true for selected documents
  const update = {
    $set: {
      "content.$[element].checked": false,
    },
  };

  // Define the arrayFilters option to specify the filter for the positional operator
  const arrayFilters = [{ "element.unChecker": true }];
  noteModel
    .updateMany(filter, update, { arrayFilters })
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
    });
};
schedule.scheduleJob("0 0 * * *", unCheck);
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
  "https://to-do-list-five-fawn-34.vercel.app",
  // "http://localhost:5173",
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
