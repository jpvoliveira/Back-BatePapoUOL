import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/participants", (req, res) => {
  const userData = req.body;
  userData.lastStatus = Date.now()

  const mongoClient = new MongoClient(
    "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=apibatepapouol"
  );
  const promise = mongoClient.connect();

  promise.then((connectedMongoClient) => {
    console.log("Conexão com sucesso");

    const dbAPIBatePapoUOL = connectedMongoClient.db("APIBatePapoUOL");
    const participantsCollection = dbAPIBatePapoUOL.collection("participantes");
    const promiseAddParticipants = participantsCollection.insertOne(userData);
  
    promiseAddParticipants.then(()=>{
      res.send(userData)
      mongoClient.close()
    })

    promiseAddParticipants.catch(err => {
      res.send(err)
      mongoClient.close()
    })
  
  });

  promise.catch((error) => {
    console.log("Erro na conexão ", error);
    res.send(error);
    mongoClient.close();
  });
});

app.listen(5000);
