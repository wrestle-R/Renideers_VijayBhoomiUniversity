const authMiddleware = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No user ID provided" });
  }

  req.user = { userId };
  next();
};

module.exports = authMiddleware;
