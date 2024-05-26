const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 500;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());



// app.all("*", (req, res, next) => {
//   const error = new Error(`the requested url is invalid :${req.url}`);
//   error.status = 404;
//   next(error);
// });

// app.use((err, req, res, next) => {
//   res.status(err.status || 500).send({
//     message: err.message,
//   });
// });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.77jbz4j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;
const main = async () => {
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)

      await client.connect();
      console.log("DB connected");

      const recipesShare = client.db("recipeShare");
      const userCollection = recipesShare.collection("userCollection");

      // user route
      app.post("/user", async (req, res) => {
        const { displayName, photoURL, email } = req.body;

        try {
          const user = await userCollection.findOne({ email });

          if (user) {
            res.status(400).send({ message: "User already exist" });
          } else {
            const result = await userCollection.insertOne({
              displayName,
              photoURL,
              email,
              coins: 50,
            });
            res.status(201).send(result);
          }
        } catch (error) {
          console.error("Error happens on create user route: ", error);
          res.status(500).send({ message: "Internal server error" });
        }
      });


      app.get("/health", (req, res) => {
        res.send({ message: "My server is running" });
      });
      app.listen(port, () => {
        console.log(`My server is running on port ${port}`);
      });
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
  }
  run().catch(console.dir);
};

main();
