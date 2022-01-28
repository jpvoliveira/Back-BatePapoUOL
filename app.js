import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/participants", async (req, res) => {
  try {
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

    const mongoClient = new MongoClient(
      "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=apibatepapouol"
    );
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");

    const participantsCollection = dbAPIBatePapoUOL.collection("participantes");
    await participantsCollection.insertOne(userData);

    const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");
    console.log(userJoin)
    await messagesCollection.insertOne(userJoin);

    res.sendStatus(201);
    mongoClient.close();
  } catch {
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const mongoClient = new MongoClient(
      "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=apibatepapouol"
    );
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

app.get("/messages", async (req, res)=>{
  try{
    const mongoClient = new MongoClient(
      "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=apibatepapouol"
    );
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");
    const messages = await messagesCollection.find({}).toArray();

    res.send(messages);
    mongoClient.close();
  }catch{
    res.sendStatus(500)
  }
})

app.post("/messages", async(req, res)=>{
  try{
    const message = {
      from: req.headers.user,
      to: req.body.to,
      text: req.body.text,
      type: req.body.type,
      time: dayjs().format("HH:mm:ss"),
    };

    const mongoClient = new MongoClient(
      "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=apibatepapouol"
    );
    await mongoClient.connect();

    const dbAPIBatePapoUOL = mongoClient.db("APIBatePapoUOL");
    const messagesCollection = dbAPIBatePapoUOL.collection("mensagens");
    const sendMessage = await messagesCollection.insertOne(message);

    res.send(sendMessage);
    mongoClient.close();
  }catch{
    res.sendStatus(500)
  }
})

app.listen(5000);
