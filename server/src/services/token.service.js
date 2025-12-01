const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const RefreshTokenModel = require("../models/refreshToken.model");
const { hashValue } = require("../utils/hash.util");



//création d'un access token pour la connexion et l'authentification
const createAccessToken = async (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET_KEY,
        {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRESIN
        }
    )
}

const timeToMs = (time) => {
    //20m, 1h ou 2d
    if(time.endsWith('d')) return parseInt(time) * 24 * 60 * 60 * 1000; //jours en millisecondes
    if(time.endsWith('h')) return parseInt(time) * 60 * 60 * 1000; //heures en millisecondes
    if(time.endsWith('m')) return parseInt(time) * 60 * 1000; //minutes en millisecondes
    if(time.endsWith('s')) return parseInt(time) * 1000; //secondes en millisecondes
    return parseInt(time) ;

    /**
     * time.endsWith('d') ? parseInt(time) * 24 * 60 * 60 * 1000 
     * : time.endsWith('h') ? parseInt(time) * 60 * 60 * 1000
     * : time.endsWith('m') ? parseInt(time) * 60 * 1000 
     * : time.endsWith('s') ? parseInt(time) * 1000 
     * : parseInt(time);
     */
}

const createRefreshToken = async (userId, userAgent) => {
    const token = crypto.randomBytes(64).toString('hex'); //128 caractères hexadécimaux
    const jti = crypto.randomBytes(16).toString('hex'); // 32 caractères hexadécimaux

    const expiresAt = new Date(Date.now() + timeToMs(process.env.JWT_REFRESH_TOKEN_EXPIRESIN));
    const tokenHash = await hashValue(token);

    await RefreshTokenModel.create({
        userId,
        jti,
        tokenHash,
        expiresAt,
        userAgent
    });

    return {token, jti, expiresAt};
}

async function revokeRefreshToken(jti) {
  try {
    const result = await RefreshTokenModel.deleteOne({jti});

    return result.deletedCount > 0; // true si un document a été supprimé
  } catch (error) {
    console.error("❌ Erreur revokeRefreshToken:", error);
    return false;
  }
};

async function verifyRefreshToken(jti, token) {
  try {
    // ✅ 1️⃣ Vérifie le refresh token en BDD
    const storedToken = await RefreshTokenModel.findOne({ jti});
     
  
    if (!storedToken) {
      return null; // aucun refresh trouvé en BDD 
    }

    const veryfToken = await compareValue(token, storedToken.tokenHash);
    
    
    // ✅ 2️⃣ Vérifie si l'utilisateur existe encore
    if (!veryfToken) {
      return null; // le token n'est pas valide
    }
    
    // ✅ 3️⃣ Vérifie si l'utilisateur existe encore
    const user = await UserModel.findById(storedToken.user);
   
    if (!user) {
      return null; // utilisateur supprimé ou introuvable
    }
    
 
    return user._id;

  } catch (error) {
    console.error("❌ Erreur dans getUserIdRefreshToken:", error);
    throw new Error("Erreur interne lors de la vérification du token");
  }
}


module.exports = {
    createAccessToken,
    timeToMs,
    createRefreshToken,
    revokeRefreshToken,
    verifyRefreshToken
}