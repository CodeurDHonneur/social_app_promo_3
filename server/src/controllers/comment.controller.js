const HttpError = require("../models/error.model");
const CommentModel = require("../models/comment.model");
const PostModel = require("../models/post.model");
const UserModel = require("../models/user.model");




// **************** CREATE COMMENT ***************
// POST : api/comments/:postId
// PROTECTED
const createComment = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;

        // ❌ Vérifier si le commentaire est vide
        if (!comment) {
            return next(new HttpError("Veuillez écrire un commentaire.", 422));
        }

        // 👤 Récupérer les informations du créateur du commentaire
        const commentCreator = await UserModel.findById(req.userId);
        if (!commentCreator) {
            return next(new HttpError("Utilisateur non trouvé.", 404));
        }

        // 📝 Création du commentaire
        const newComment = await CommentModel.create({
            creator: {
                creatorId: req.userId,
                creatorName: commentCreator.fullName,
                creatorPhoto: commentCreator.profilePhoto,
            },
            postId,
            comment
        });

        // ➕ Ajouter le commentaire dans le post concerné
        await PostModel.findByIdAndUpdate(
            postId,
            { $push: { comments: newComment._id } },
            { new: true }
        );

        // ✅ Réponse de succès
        return res.status(200).json({
            message: "Commentaire créé avec succès.",
            comment: newComment
        });

    } catch (error) {
        return next(new HttpError(error.message || "Erreur lors de la création du commentaire.", 500));
    }
};



// **************** GET POST COMMENTS ***************
// GED : api/comments/:postId
// PROTECTED
const getPostComments = async (req, res, next) => {
    try {
        const { postId } = req.params;

        // 📌 Vérifier que le post existe
        const post = await PostModel.findById(postId).populate({
            path: "comments",
            options: { sort: { createdAt: -1 } }
        });

        if (!post) {
            return next(new HttpError("Post introuvable.", 404));
        }

        // 📌 Retourner uniquement les commentaires, pas tout le post
        return res.status(200).json({
            message: "Commentaires récupérés avec succès.",
            comments: post
        });

    } catch (error) {
        return next(
            new HttpError(error.message || "Erreur lors de la récupération des commentaires.", 500)
        );
    }
};



// **************** DELETE COMMENTS ***************
// DELETE : api/comments/:commentId
// PROTECTED
const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        // 🔎 Vérifier que le commentaire existe
        const comment = await CommentModel.findById(commentId);
        if (!comment) {
            return next(new HttpError("Commentaire introuvable.", 404));
        }

        // 🔎 Récupérer le créateur du commentaire
        const commentCreator = await UserModel.findById(comment?.creator?.creatorId);
        if (!commentCreator) {
            return next(new HttpError("Créateur du commentaire introuvable.", 404));
        }

        // 🔐 Vérifier si l'utilisateur connecté est bien l'auteur du commentaire
        if (commentCreator._id.toString() !== req.userId) {
            return next(new HttpError("Vous n'êtes pas autorisé à supprimer ce commentaire.", 403));
        }

        // 🧹 Retirer le commentaire du tableau du post
        await PostModel.findByIdAndUpdate(
            comment.postId,
            { $pull: { comments: commentId } }
        );

        // 🗑️ Supprimer le commentaire lui-même
        const deletedComment = await CommentModel.findByIdAndDelete(commentId);

        // ✅ Réponse de succès
        return res.status(200).json({
            message: "Commentaire supprimé avec succès.",
            deletedComment
        });

    } catch (error) {
        return next(
            new HttpError(error.message || "Erreur lors de la suppression du commentaire.", 500)
        );
    }
};


module.exports = { createComment, getPostComments, deleteComment };