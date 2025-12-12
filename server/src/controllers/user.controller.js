const HttpError = require("../models/error.model");
const UserModel = require("../models/user.model");
const { createAccessToken, createRefreshToken, timeToMs, revokeRefreshToken, verifyRefreshToken } = require("../services/token.service");
const { hashValue, compareValue } = require("../utils/hash.util");
const {v4: uuid} = require("uuid");
const path = require("path");
const util = require("util");
const cloudinary = require("../config/cloudinary.config");

/* Enregistrement d'un utilisateur, POST : api/users/register */

const registerUser = async (req, res, next) => {

    try {
        const { fullName, email, password, confirmPassword } = req.body;

        //vérification des champs obligatoires
        if (!fullName || !email || !password || !confirmPassword) {
            return next(new HttpError("Merci de remplir tous les champs", 422));
        }

        //Normalisation de l'adresse mail
        const lowerCasedEmail = email.toLowerCase();

        //Vérification de la conformité des mots de passe
        if (password !== confirmPassword) {
            return next(new HttpError("Les mots de passe ne correspondent pas. Merci de réessayer", 422));
        }

        if (password.length < 8) {
            return next(new HttpError("Mot de passe trop court, 8 caractères au minimum", 422));
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
    const user = await UserModel.findOne({ email: lowerCasedEmail });

    if (!user) {
        return next(new HttpError("Identifiants invalides", 401));
    }

    const isMatch = await compareValue(password, user.password);

    if (!isMatch) {
        return next(new HttpError("Identifiants invalides", 401));
    }

    const payload = { userId: user._id };

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
   
    console.log("user => ", user);

    const {password: _, ...userInfo} = user._doc;

    res.status(200).json({
        success: true,
        message: "Connexion réussie",
        accessToken,
        userInfo
    });
}

/* Méthode de déconnexion, POST : /api/users/logout */
const logoutUser = async (req, res, next) => {
    try {
        console.log()
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
        return next(new HttpError("Erreur serveur", 500));
    }
}

/* Rafraîchir le token d'accès à partir du refresh token, POST : /api/users/renewAccessToken */
const renewAccessToken = async (req, res, next) => {
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
        // console.log(parsed);
        const { jti, token } = parsed;


        // ✅ 3️⃣ Récupère l'ID utilisateur depuis la BDD
        const userId = await verifyRefreshToken(jti, token);


        if (!userId) {
            return next(new HttpError("Token de rafraîchissement invalide ou expiré", 403));
        }
        // ✅ 4️⃣ Génère un nouveau token d'accès
        const accessToken = await createAccessToken({ userId });

        // ✅ 5️⃣ Met à jour le cookie accessToken
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: timeToMs(process.env.JWT_ACCESS_TOKEN_EXPIRESIN),
        });

        // ✅ 6️⃣ Réponse au client
        return res.status(200).json({
            success: true,
            message: "Nouveau token généré ✅",
            accessToken: accessToken,
        });

    } catch (error) {
        return next(new HttpError(error.message || "Erreur serveur", 500));
    }
}


/* Méthode de récupération de tous les utilisateurs, GET : /api/users/all */
const getUsers = async (req, res, next) => {
    try {

        // ✅ 1️⃣ Récupère les paramètres de pagination depuis la query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // ✅ 2️⃣ Récupère les utilisateurs les plus récents, sans champs sensibles
        const users = await UserModel.find()
            .select("-password -email -__v -updatedAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // ✅ 3️⃣ Compte le total pour la pagination
        const totalUsers = await UserModel.countDocuments();

        // ✅ 4️⃣ Retourne une réponse cohérente
        return res.status(200).json({
            success: true,
            message: "Liste des utilisateurs récupérée avec succès ✅",
            totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            users
        });

    } catch (error) {
        return next(new HttpError(error.message || "Erreur serveur", 500));
    }
}


/* Méthode de récupération d'un utilisateur,  GET : /api/users/:id */
const getUser = async (req, res, next) => {
    try {
        // ✅ 1️⃣ Récupération de l'ID passé en paramètre d'URL
        const { id } = req.params;

        // ✅ 2️⃣ Recherche de l'utilisateur en base de données
        // On exclut certains champs sensibles avec .select()
        const user = await UserModel.findById(id).select("-password -email -updatedAt -__v");

        // ✅ 3️⃣ Vérifie si l'utilisateur existe
        if (!user) {
            return next(new HttpError("Utilisateur non identifié", 404));
        }

        // ✅ 4️⃣ Retourne les données publiques de l'utilisateur
        return res.status(200).json({
            success: true,
            message: "Utilisateur trouvé ✅",
            user
        });

    } catch (error) {
        console.error("❌ Error in getUser:", error);
        return next(new HttpError(error.message || "Erreur serveur", 500));
    }
};

/* Méthode de modification d'un utilisateur, PATCH : /api/users/:id */
const editUser = async (req, res, next) => {
    try {
        // ✅ 1️⃣ Vérifie que l'utilisateur est connecté
        if (!req.userId) {
            return next(new HttpError("Authentication required", 401));
        }

        // ✅ 2️⃣ Récupère les champs du corps de la requête
        const { fullName, bio } = req.body;

        // ✅ 3️⃣ Vérifie que les données à mettre à jour existent
        if (!fullName && !bio) {
            return next(new HttpError("No data provided to update", 400));
        }

        // ✅ 4️⃣ Prépare les données à mettre à jour
        const data = {};
        if (fullName) data.fullName = fullName;
        if (bio) data.bio = bio;


        // ✅ 5️⃣ Met à jour l'utilisateur connecté
        const editedUser = await UserModel.findByIdAndUpdate(
            req.userId,
            data,
            { new: true } // retourne la version mise à jour
        ).select("-password"); // ⚙️ optionnel : retire le mot de passe du résultat

        if (!editedUser) {
            return next(new HttpError("User not found", 404));
        }

        // ✅ 6️⃣ Retourne le résultat
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully ✅",
            user: editedUser
        });

    } catch (error) {
        return next(new HttpError(error.message || "Server error", 500));
    }
}

/*  Suivre ou ne plus suivre un user,  PATCH : /api/users/:id/follow-unfollow, protégée */
const followUnfollowerUser = async (req, res, next) => {
    try {

        const userToFollowId = req.params.id;

        if (!userToFollowId) {
            return next(new HttpError("Merci de choisir l'utilisateur à suivre.", 422));
        }

        if (!req.userId) {
            return next(new HttpError("Authentification requise", 401));
        }

        if (req.userId == userToFollowId) {
            return next(new HttpError("Vous ne pouvez pas vous suivre ou vous désaboner de vous-même", 422));
        }

        const userToFollow = await UserModel.findById(userToFollowId);
        if (!userToFollow) {
            return next(new HttpError("Utilisateur introuvable", 404));
        }

        const currentUser = await UserModel.findById(req.userId);
        if (!userToFollow) {
            return next(new HttpError("Désolé, nous n'avons pas pu vous authentifier.", 404));
        }


        const isFollower = userToFollow.followers.includes(req.userId);

        // const isFollower = userToFollow.followers.find(param => param.toString() == req.userId.toString());

        let updatedTargetUser;
        let updatedCurrentUser;
        let message;

        if (!isFollower) {
            // ➕ Suivre un utilisateur
            updatedTargetUser = await UserModel.findByIdAndUpdate(
                userToFollowId,
                { $push: { followers: req.userId } },
                { new: true }
            );

            updatedCurrentUser = await UserModel.findByIdAndUpdate(
                req.userId,
                { $push: { following: userToFollowId } },
                { new: true }
            );

            message = "Utilisateur suivi avec succès ✅";
        } else {
            console.log("A retirer", req.userId)
            updatedTargetUser = await UserModel.findByIdAndUpdate(
                userToFollowId,
                { $pull: { followers: req.userId } },
                { new: true }
            );

            updatedCurrentUser = await UserModel.findByIdAndUpdate(
                req.userId,
                { $pull: { following: userToFollowId } },
                { new: true }
            );
            message = "Utilisateur non suivi avec succès 📴";
        }

        // ✅ 6️⃣ Retourne une réponse claire
        return res.status(200).json({
            success: true,
            message,
            currentUser: {
                id: updatedCurrentUser._id,
                following: updatedCurrentUser.following,
            },
            targetUser: {
                id: updatedTargetUser._id,
                followers: updatedTargetUser.followers,
            },
        });
    } catch (error) {
        return next(new HttpError(error.message || "Erreur serveur", 500));
    }
}

/* Méthode de modification de l'avatar d'un user, POST : /api/users/avatar, protégée */
const changeUserAvatar = async (req, res, next) => {

    try {


        // ✅ Vérifie si un fichier "avatar" est présent dans la requête
        if (!req.files.avatar) {
            // Si aucun fichier n’est fourni, on renvoie une erreur 422 (unprocessable entity)
            return next(new HttpError("Please choose an image", 422));
        }

        // ✅ On récupère l’objet "avatar" depuis les fichiers envoyés
        const { avatar } = req.files;

        // ✅ Vérifie la taille du fichier (ici, max 500 ko)
        if (avatar.size > 500000) {
            return next(new HttpError("Profile picture too big. Should be less than 500kb", 422));
        }

        // ✅ Génération d’un nom unique pour le fichier uploadé
        //    On sépare le nom du fichier et son extension, puis on ajoute un UUID
        let fileName = avatar.name;
        let splittedFilename = fileName.split(".");
        let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];

        // ✅ Définit le chemin complet où le fichier sera temporairement enregistré sur le serveur
        const uploadPath = path.join(__dirname, "..", "uploads", newFilename);

        // ✅ avatar.mv utilise un callback, donc on le "promisifie" pour pouvoir l'utiliser avec await
        const mv = util.promisify(avatar.mv);

        // ✅ Déplace le fichier uploadé vers le dossier "uploads"
        await mv(uploadPath);

        // ✅ Upload du fichier sur Cloudinary (service de stockage d’images)
        //    On indique que c’est une ressource de type "image"
        const result = await cloudinary.uploader.upload(uploadPath, { resource_type: "image" });

        // ✅ Vérifie que Cloudinary a bien retourné une URL d’image valide
        if (!result.secure_url) {
            return next(new HttpError("Couldn't upload image to cloudinary", 422));
        }

        // ✅ Met à jour le champ "profilePhoto" de l'utilisateur connecté
        //    avec l'URL sécurisée retournée par Cloudinary
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.userId,                          // ID de l'utilisateur connecté
            { profilePhoto: result.secure_url },   // Nouvelle photo de profil
            { new: true }                          // Renvoie le document mis à jour
        );


        // ✅ Envoie la réponse au client avec le nouvel utilisateur mis à jour
        return res.status(200).json(updatedUser);
    } catch (error) {
        return next(new HttpError(error.message || JSON.stringify(error), 500));
    }

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