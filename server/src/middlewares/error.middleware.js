
const notFound = (req, res, next) => {

    //http://localhost:8000/api/users/register'
    //req.originalUrl -> api/users/register
    const error = new Error(`Not found - ${req.originalUrl}`);

    res.status(404);

    next(error);
}


const errorHandler = (error, req, res, next) => {
    
    if(res.headersSent){
        return next(error);
    }

    res.status(error.code || 500).json({
        message: error.message || "Une erreur inconnue s'est produite."
    })
}

module.exports = {notFound, errorHandler};