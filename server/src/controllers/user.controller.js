const HttpError = require("../models/error.model");
const UserModel = require("../models/user.model");
const { createAccessToken, createRefreshToken, timeToMs, revokeRefreshToken, verifyRefreshToken } = require("../services/token.service");
const { hashValue, compareValue } = require("../utils/hash.util");

/* Enregistrement d'un utilisateur, POST : api/users/register */

const registerUser = async (req, res, next) => {

    try {
        const { fullName, email, password, confirmPassword } = req.body;

        //vérification des champs obligatoires
        if (!fullName || !email || !password || !confirmPassword) {
            return next(new HttpError("Merci de remplir les champs", 422));
        }

        //Normalisation de l'adresse mail
        const lowerCasedEmail = email.toLowerCase();

        //Vérification de la conformité des mots de passe
        if (password !== confirmPassword) {
            return next(new HttpError("Les mots de passe ne correspondent pas. Merci de réessayer", 422));
        }

        if (password.length < 8) {
            return next(new HttpError("Mot de passe trop court, 8 caractère au minimum", 422));
        }


        //Vérifier si l'adresse mail n'est pas déjà liée à un compte utilisateur
        const emailExist = await UserModel.findOne({ email: lowerCasedEmail });
        if (emailExist) {
            return next(new HttpError("Désolé, cette adresse mail est déjà utilisée."))
        }


        //hashage du mot de passe
        const hashPassword = await hashValue(password);

        //Création du user en bdd
        const newUser = await UserModel.create({
            fullName,
            email: lowerCasedEmail,
            password: hashPassword
        });
        const { fullName: userFullname } = newUser;
        res.status(201).json({
            message: `Utilisateur ${userFullname} créé avec succès`
        });

    } catch (error) {
        return next(new HttpError(error.message || "Une erreur s'est produite", error.code || 500));
    }
}


/* Méthode de connexion, POST : /api/users/login */
const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
 
    //vérifier que les valeurs existent
    if (!email || !password) {
        return next(new HttpError("Tous les chams sont requis", 422));
    }
    
    //Normalisation de l'adresse mail
    const lowerCasedEmail = email.toLowerCase();
    
    //Récherche de l'utilisateur en bdd
    const user = await UserModel.findOne({email: lowerCasedEmail});
    

    if(!user){
        return next(new HttpError("Identifiants invalides", 401));
    }
    
    const isMatch = await compareValue(password, user.password);
    
    console.log("2");
    if(!isMatch){
        return next(new HttpError("Identifiants invalides", 401));
    }
    
    const payload = {userId: user._id};
    

    const accessToken = await createAccessToken(payload);
    const refreshToken = await createRefreshToken(user._id.toString(), req.get("User-Agent"));
    
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: timeToMs(process.env.JWT_ACCESS_TOKEN_EXPIRESIN)
    });
    
    res.cookie("refreshToken", JSON.stringify({
        jti: refreshToken.jti,
        token: refreshToken.token
    }), {
        httpOnly: true,
        sameSite: "strict",
        maxAge: timeToMs(process.env.JWT_REFRESH_TOKEN_EXPIRESIN)
    });
    

    res.status(200).json({
        success: true,
        message: "Connexion réussie",
        accessToken,
        
    });
}

/* Méthode de déconnexion, POST : /api/users/logout */
const logoutUser = async (req, res, next) => {

  try {
    // ✅ 1️⃣ Récupère les cookies
    const refreshCookie = req.cookies?.refreshToken || req.cookie?.refreshToken;

    // console.log(req);
    if (!refreshCookie) {
      return next(new HttpError("Aucun token de rafraîchissement trouvé", 400));
    }

    // ✅ 2️⃣ Parse le cookie
    let parsed;
    try {
      parsed = JSON.parse(refreshCookie);
    } catch {
      return next(new HttpError("Format de token invalide", 400));
    }

    const { jti } = parsed;

    // ✅ 3️⃣ Révoque (supprime) le token dans la BDD
    const deleted = await revokeRefreshToken(jti);

    if (!deleted) {
      return next(
        new HttpError(
          "Le token n'existe plus",
          404
        )
      );
    }

    // ✅ 4️⃣ Supprime les cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
    });

    // ✅ 5️⃣ Réponse
    return res.status(200).json({
      success: true,
      message: "Déconnexion réussie 👋",
    });
  } catch (error) {
    console.error("❌ Erreur logoutUser:", error);
    return next(new HttpError("Erreur serveur", 500));
  }
};

/* Rafraîchir le token d'accès à partir du refresh token, POST : /api/users/renewAccessToken */
const renewAccessToken  = async (req, res, next) => {
  try {
    // ✅ 1️⃣ Récupère le cookie de rafraîchissement
    const refreshCookie = req.cookies?.refreshToken || req.cookie?.refreshToken;

    if (!refreshCookie) {
      return next(new HttpError("Aucun token de rafraîchissement trouvé", 400));
    }

    // ✅ 2️⃣ Parse le JSON du cookie
    let parsed;
    try {
      parsed = JSON.parse(refreshCookie);
    } catch {
      return next(new HttpError("Format de token invalide", 400));
    }
    
    console.log(parsed);
    const { jti, token } = parsed;
    
    
    // ✅ 3️⃣ Récupère l'ID utilisateur depuis la BDD
    const userId = await verifyRefreshToken(jti, token);
    
    console.log(userId);

    if (!userId) {
      return next(new HttpError("Token de rafraîchissement invalide ou expiré", 403));
    }
    
    // ✅ 4️⃣ Génère un nouveau token d'accès
    const accessToken = await createAccessToken({ userId });
    console.log(accessToken);

    // ✅ 5️⃣ Met à jour le cookie accessToken
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: timeToMs(process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
    });

    // ✅ 6️⃣ Réponse au client
    return res.status(200).json({
      success: true,
      message: "Nouveau token généré ✅",
      accessToken: accessToken,
    });

  } catch (error) {
    console.error("❌ Erreur dans refreshAccessToken:", error);
    return next(new HttpError(error.message || "Erreur serveur", 500));
  }
};


/* Méthode de récupération d'un utilisateur,  GET : /api/users/:id */
const getUser = (req, res, next) => {

}

/* Méthode de récupération de tous les utilisateurs, GET : /api/users/all */
const getUsers = (req, res, next) => {

}

/* Méthode de modification d'un utilisateur, PATCH : /api/users/:id */
const editUser = (req, res, next) => {

}

/*  Suivre ou ne plus suivre un user,  PATCH : /api/users/:id/follow-unfollow, protégée */
const followUnfollowerUser = (req, res, next) => {

}

/* Méthode de modification de l'avatar d'un user, POST : /api/users/avatar, protégée */
const changeUserAvatar = (req, res, next) => {

}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    renewAccessToken,
    getUser,
    getUsers,
    editUser,
    followUnfollowerUser,
    changeUserAvatar
}