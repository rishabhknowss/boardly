import express, { Application } from "express";
import { middleware } from "./middleware";
const app: Application = express();

app.post("/signup", (req, res) => {
  // Handle signup logic here
  res.status(200).send("Signup successful");
});

app.post("/signin", (req, res) => {
  // Handle signup logic here
  res.status(200).send("Signup successful");
});

app.post("/signout", (req, res) => {
  // Handle signout logic here
  res.status(200).send("Signout successful");
});

app.post("/create-room", middleware, (req, res) => {
  // Handle room creation logic here
  res.status(200).send("Room created successfully");
});

app.post;

app.listen(3000, () => {
  console.log("HTTP Backend is running on port 3000");
});
export default app;
