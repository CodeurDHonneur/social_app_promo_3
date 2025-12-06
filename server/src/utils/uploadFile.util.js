const HttpError = require("../models/error.model");
const path = require("path");
const {v4: uuid} = require("uuid");
const cloudinary = require("../config/cloudinary.config");


const uploadFile = async (image, fonc) => {
    if (image.size > 1000000) {
        return fonc(
            new HttpError("Profile picture too big. Should be less than 1MB", 422)
        );
    }

    // Générer un nom unique pour le fichier
    const ext = path.extname(image.name);
    const fileName = `${path.basename(image.name, ext)}-${uuid()}${ext}`;
    const localPath = path.join(__dirname, "..", "uploads", fileName);

    // Déplacer l'image vers le dossier local
    await image.mv(localPath);

    // Upload sur Cloudinary
    const result = await cloudinary.uploader.upload(localPath, {
        resource_type: "image",
    });

    if (!result.secure_url) {
        return fonc(new HttpError("Couldn't upload image to Cloudinary", 422));
    }

    return result.secure_url;
}

module.exports = uploadFile;