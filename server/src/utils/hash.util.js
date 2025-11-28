const bcrypt = require("bcryptjs");



const hashValue = async (value) => {
    const saltRounds = 15;

    const salt = await bcrypt.genSalt(saltRounds);

    const hashPassword = await bcrypt.hash(value, salt);
    
    return hashPassword;
}

const comparaValue = async (value, hashValue) => {
    const boolean = await bcrypt.compare(value, hashValue);
    return boolean;
}


module.exports = {
    hashValue,
    comparaValue
}