import { Document, model, Schema } from "mongoose";

export interface ICategory extends Document {
  icon: string;
  title: string;
  skills: string;
  slug: string;
}

const categorySchema = new Schema<ICategory>(
  {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    skills: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const CategoryModel = model<ICategory>("category", categorySchema);
