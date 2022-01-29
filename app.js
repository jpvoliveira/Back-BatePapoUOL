import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const userSchema = joi.object({ name: joi.string().required() });

app.post("/participants", async (req, res) => {
  try {
    const validation = userSchema.validate(req.body);
    if (validation.error) {
      res.sendStatus(422);
      return;
    }

    const userData = {
      name: req.body.name,
      lastStatus: Date.now(),
    };

    const userJoin = {
      from: req.body.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const participantsCollection = dbAPIBatePapoUOL.collection("participantes");
    const participant = await participantsCollection.findOne({
      name: userData.name,
    });

    if (participant) {
      res.sendStatus(409);
      return;
    }

    await participantsCollection.insertOne(userData);

    const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");
    await messagesCollection.insertOne(userJoin);

    res.sendStatus(201);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const participantsCollection = dbAPIBatePapoUOL.collection("participantes");
    const participants = await participantsCollection.find({}).toArray();

    res.send(participants);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  try {
    let limits = 0;
    if (req.query.limit) {
      limits = parseInt(req.query.limit);
    }

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");
    const messages = await messagesCollection
      .find({
        $or: [
          { type: "message" },
          { type: "status" },
          { to: req.headers.user },
          { from: req.headers.user },
        ],
      })
      .sort({ _id: -1 })
      .limit(limits)
      .toArray();

    res.send(messages.reverse());
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message"),
  from: joi.string(),
  time: joi.string(),
});

app.post("/messages", async (req, res) => {
  try {
    const message = {
      from: req.headers.user,
      to: req.body.to,
      text: req.body.text,
      type: req.body.type,
      time: dayjs().format("HH:mm:ss"),
    };

    const validation = messageSchema.validate(message);
    if (validation.error) {
      res.sendStatus(422);
      return;
    }

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");
    const sendMessage = await messagesCollection.insertOne(message);

    res.send(sendMessage);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  try {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const participantsCollection = dbAPIBatePapoUOL.collection("participantes");
    const user = await participantsCollection.findOne({
      name: req.headers.user,
    });

    if (!user) {
      res.sendStatus(404);
      mongoClient.close();
      return;
    }
    await participantsCollection.updateOne(
      { lastStatus: user.lastStatus },
      { $set: { lastStatus: Date.now() } }
    );
    res.sendStatus(200);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

async function kickUser() {
  const mongoClient = new MongoClient(process.env.MONGO_URI);
  await mongoClient.connect();

  const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
  const participantsCollection = dbAPIBatePapoUOL.collection("participantes");
  const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");

  const users = await participantsCollection.find().toArray();

  users.forEach((item) => {
    if (Date.now() - 10000 > item.lastStatus) {
      participantsCollection.deleteOne({ _id: new ObjectId(item._id) });
      messagesCollection.insertOne({
        from: item.name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
      });
    }
  });
}

setInterval(kickUser, 15000);

app.listen(5000);
