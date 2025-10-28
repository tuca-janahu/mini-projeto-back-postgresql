import mongoose, { Schema, Document, Model, Types, HydratedDocument } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;  
  name: string,     
  email: string;
  password: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  name: { type: String, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export type UserDoc = HydratedDocument<IUser>;
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
