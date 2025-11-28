const HttpError = require("../models/error.model");
const UserModel = require("../models/user.model");
const { hashValue } = require("../utils/hash.util");

/* Enregistrement d'un utilisateur, POST : api/users/register */

const registerUser = async (req, res, next) => { 
    console.log("Création d'un utiisateur");
    /**
     * fullName
     * email
     * password
     * confirmPassword
     * req.body
     */
    try {
        const {fullName, email,  password, confirmPassword} = req.body;

        //vérification des champs obligatoires
        if(!fullName || !email || !password || !confirmPassword){
            return next(new HttpError("Merci de remplir les champs", 422));
        }

        //Normalisation de l'adresse mail
        const lowerCasedEmail = email.toLowerCase();

        //Vérification de la conformité des mots de passe
        if(password !== confirmPassword){
            return next(new HttpError("Les mots de passe ne correspondent pas. Merci de réessayer", 422));
        }

        if(password.length < 8){
            return next(new HttpError("Mot de passe trop court, 8 caractère au minimum", 422));
        }


        //Vérifier si l'adresse mail n'est pas déjà liée à un compte utilisateur
        const emailExist = await UserModel.findOne({email: lowerCasedEmail});
        if(emailExist){
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
        const {fullName: userFullname} = newUser;
        res.status(201).json({
            message: `Utilisateur ${userFullname} créé avec succès`
        });
        
    } catch (error) {
        return next(new HttpError(error.message || "Une erreur s'est produite", error.code || 500));
    }
}


/* Méthode de connexion, POST : /api/users/login */
const loginUser = (req, res, next) => {

}

/* Méthode de déconnexion, POST : /api/users/logout */
const logoutUser = (req, res, next) => {

}

/* Rafraîchir le token d'accès à partir du refresh token, POST : /api/users/renewAccessToken */
const renewAccessToken = (req, res, next) => {
    
}

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