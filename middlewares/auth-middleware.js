import jwt from 'jsonwebtoken';

export const requiredSignIn = (req,res,next)=>{
    try {
        const token = req.header('Authorization');
        if(!token)
        {
            res.status(401).json({
                error:"Access denied",
                message:"auth token required !"
            });
        }
        const decode= jwt.verify(token,process.env.JWT_SECRET_KEY);
        req.user=decode
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Invalid Token",
            message: "Token verification failed!",
            error
        });
    }
}

