const adminAuth = (req,res,next)=>{
    const token="vaidddya";
    const isAuthorized=token==="vaidya";
    if(!isAuthorized){
        res.status(403).send("Unauthorized request");
    }else{
        next();
    }
};

const userAuth = (req,res,next)=>{
    const token="vaidya";
    const isAuthorized=token==="vaidya";
    if(!isAuthorized){
        res.status(403).send("Unauthorized request");
    }else{
        next();
    }
};

module.exports={adminAuth,userAuth};