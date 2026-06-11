import jwt from "jsonwebtoken";

export function verifyParticipant(
  req,
  res,
  next
) {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
}

export function verifyAdmin(
  req,
  res,
  next
) {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }



    const token =
      authHeader.split(" ")[1];



    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );



    // CHECK ROLE

    if (
      decoded.role !== "admin"
    ) {

      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }



    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
}