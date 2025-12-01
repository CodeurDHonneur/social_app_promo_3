

const mongoose = requre("mongoose");

const refreshTokenSchema = new Schema({
    userId: {
        type: mongoose.Schema.Type.ObjectId,
        ref: "User",
        required: true
    }, //id de l'utilisateur
    jti: {
        type: String,
        required: true,
        index: true
    }, //identifiant du token
    tokenHash: {
        type: String,
        required: true
    }, //hachage dutoken
    expiresAt: {
        type: Date,
        required: true
    }, //Délai d'expiration
    userAgent: {type: String}
}, {
    timestamps: true
});

refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});


module.exports = mongoose.model("RefreshToken", refreshTokenSchema)


