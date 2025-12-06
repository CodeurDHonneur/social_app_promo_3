const HttpError = require("../models/error.model");
const ConversationModel = require("../models/conversation.model");
const MessageModel = require("../models/message.model");
const { getReceiverSockedId, io } = require("../socket/socket");


// **************** CREATE MESSAGE ***************
// POST : api/messages/:receiverId
//PROTECTED

const createMessage = async (req, res, next) => {
    try {
        const { receiverId } = req.params;
        const { messageBody } = req.body;

        // validations simples
        if (!messageBody || !messageBody.trim()) {
            return next(new HttpError("Le message est vide.", 422));
        }
        if (!receiverId) {
            return next(new HttpError("ID du destinataire manquant.", 400));
        }

        //check if ther's already a conversation between current user and receiver
        let conversation = await ConversationModel.findOne({
            participants: { $all: [req.userId, receiverId] }
        });

        if (!conversation) {

            conversation = await ConversationModel.create({
                participants: [req.userId, receiverId],
                lastMessage: {
                    text: messageBody,
                    senderId: req.userId
                }
            });
        }


        const newMessage = await MessageModel.create({
            conversationId: conversation._id,
            senderId: req.userId,
            text: messageBody
        });


        await ConversationModel.updateOne(
            { _id: conversation._id }, // filtre important
            {
                $set: {
                    lastMessage: {
                        text: messageBody,
                        senderId: req.userId,
                        createdAt: new Date()
                    }
                }
            }
        );

        const receiverSockedId = getReceiverSockedId(receiverId);
        if(receiverSockedId) {
            io.to(receiverSockedId).emit("newMessage", newMessage);
        }

        return res.status(201).json({
            message: "Message envoyé avec succès.",
            data: newMessage
        });
        
    } catch (error) {
        return next(new HttpError(error))
    }
}


// **************** GET MESSAGES ***************
// GET : api/messages/:receiverId
//PROTECTED

const getMessages = async (req, res, next) => {
    try {
        const { receiverId } = req.params;

        // Vérifie s'il existe une conversation entre l'utilisateur courant et le destinataire
        const conversation = await ConversationModel.findOne({
            participants: { $all: [req.userId, receiverId] }
        });

        // Si aucune conversation n’existe, on en informe l’utilisateur
        if (!conversation) {
            return next(new HttpError("Vous n'avez aucune conversation avec cet utilisateur.", 404));
        }

        // Récupère tous les messages associés à la conversation, triés du plus ancien au plus récent
        const messages = await MessageModel.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 });

        // Retourne les messages trouvés
        res.status(200).json(messages);

    } catch (error) {
        // En cas d’erreur inattendue, on renvoie une erreur générique
        return next(new HttpError("Une erreur est survenue lors de la récupération des messages.", 500));
    }
};



// **************** GET CONVERSATIONS ***************
// GET : api/conversation
//PROTECTED

const getConversations = async (req, res, next) => {
    try {
        // Récupère toutes les conversations où l'utilisateur courant est participant
        let conversations = await ConversationModel.find({ participants: req.userId })
            .populate({
                path: "participants",
                select: "fullName profilePhoto" // On ne retourne que le nom complet et la photo
            })
            .sort({ createdAt: -1 }); // Trier de la plus récente à la plus ancienne

        // Pour chaque conversation, on retire l'utilisateur connecté
        conversations = conversations.map((conversation) => {
            const otherParticipants = conversation.participants.filter(
                (participant) => participant._id.toString() !== req.userId.toString()
            );

            return {
                ...conversation.toObject(),
                participants: otherParticipants
            };
        });

        // Retourne toutes les conversations avec uniquement l'interlocuteur en face
        res.status(200).json(conversations);

    } catch (error) {
        return next(
            new HttpError(
                "Une erreur est survenue lors de la récupération des conversations.",
                500
            )
        );
    }
};


module.exports = { createMessage, getMessages, getConversations };