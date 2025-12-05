require("dotenv").config();
const express = require("express");
const  {connect} = require("mongoose");
const routes  = require("./src/routes");
const app = express();
const corsConfig = require("./src/config/cors.config");
const {notFound, errorHandler} = require("./src/middlewares/error.middleware");
const cookieParser = require("cookie-parser");


app.use(corsConfig);
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;


app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use("/api", routes)

app.use(notFound);
app.use(errorHandler);

connect(MONGO_URL)
.then(() => {
    app.listen(PORT, () => console.log("Serveur démarré sur le port", PORT));
})
.catch(err => console.log("Erreur lors de la connexion", err));
