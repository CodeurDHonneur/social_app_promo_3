const {Schema, model} = require("mongoose");

const userSchema = new Schema({
    fullName: {type: String, required: true},
    email : {type: String, required: true},
    password: {type: String, required: true},
    profilePhoto: {type: String, default: "https://res.cloudinary.com/df4usbpof/image/upload/v1764339278/image_profile_defaut_rvissf.jpg"},
    bio: {type: String, default : "Content d'être à HighFive University"},
    followers: [{type: Schema.Types.ObjectId, ref: "User"}],
    following: [{type: Schema.Types.ObjectId, ref: "User"}],
    bookmarks: [{type: Schema.Types.ObjectId, ref: "Post"}],
    posts: [{type: Schema.Types.ObjectId, ref: "Post"}],
},
{timestamps: true});

module.exports = model("User", userSchema);

