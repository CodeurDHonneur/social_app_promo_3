const cors = require("cors");


const corsOptions = {
    origin: process.env.FRONTEND_URL, //Autorise un domaine spécique à contacter notre serveur
    method: ["GET", "POST", "PATCH"], //Filtre les méthodes HTTP autorisées
    allowedHeaders: ["Content-Type", "Authorization"], //Spécifie les en-têtes acceptées
    creadentials: true //Autorise l'envoi de cookies & tokens
};

module.exports = cors(corsOptions);