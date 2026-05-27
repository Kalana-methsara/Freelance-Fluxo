import { IUser } from "../models/userModel";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const jWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const signAccessToken = (user: IUser): string => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.userRole,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "30m" }, 
  );
};

export const signRefreshToken = (user: IUser): string => {
  return jwt.sign(
    {
      sub: user._id.toString(),
    },
    jWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};
