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
      const recipeCollection = recipesShare.collection("recipeCollection");

      // user create route
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

      // user get route
      app.get("/user", async (req, res) => {
        const email = req.query.email;

        try {
          if (email) {
            const user = await userCollection.findOne({ email });
            res.status(200).send(user);
          } else {
            const users = await userCollection.find({}).toArray();
            res.status(200).send(users);
          }
        } catch (error) {
          console.error("This error happen on user get route: ", error);
        }
      });

      // insert recipe route
      app.post("/recipe", async (req, res) => {
        const recipe = req.body;

        const creatorEmail = recipe.creatorEmail;

        try {
          const result = await recipeCollection.insertOne(recipe);
          if (result.acknowledged && creatorEmail) {
            const increaseCoin = await userCollection.updateOne(
              { email: creatorEmail },
              { $inc: { coins: 1 } }
            );
            increaseCoin.matchedCount > 0
              ? res.status(201).send({
                  add_recipe_message: "Recipe published successfully",
                  coin_increase_message: "Congrats you get 1 coin",
                })
              : res.status(404).send({ message: "User not found" });
          } else {
            res.status(400).send({ message: "Bad request" });
          }
        } catch (error) {
          console.error("This error happens on recipe insert route: ", error);
          res.status(500).send("Internal server error");
        }
      });

      // get single recipe
      app.get("/recipe/:title", async (req, res) => {
        const title = req.params.title;
        try {
          const recipe = await recipeCollection.findOne({ recipe_name: title });
          if (recipe) {
            const updatedWatchCount = await recipeCollection.updateOne(
              { recipe_name: title },
              { $inc: { watchCount: 1 } }
            );
            res.status(200).send(recipe);
          } else {
            res.status(404).send("Recipe not found");
          }
        } catch (error) {
          console.error("This error happens on get single recipe route: ", error);
          res.status(500).send("Internal server error");
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
