
module.exports = function authCustomServices(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    if(token === process.env.VOXCHAT_API_KEY){
        return next();
    }
    return res.status(403).json({ message: 'Token inválido ou expirado' });
}
