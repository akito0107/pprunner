import { default as express } from "express";

const app = express();
app.set("view engine", "pug");

app.get("/login", (req, res) => {
  res.render();
});

app.listen(3000);
