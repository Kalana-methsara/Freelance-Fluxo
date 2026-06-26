import dotenv from "dotenv";
dotenv.config();

import mongoDB from "../config/db";
import { CategoryModel } from "../models/categoryModel";

const CATEGORIES = [
  { icon: "🎨", title: "Graphics & Design", skills: "Logo Design, UI/UX, Illustration", slug: "graphics-design" },
  { icon: "📣", title: "Digital Marketing", skills: "SEO, Social Media, Content Marketing", slug: "digital-marketing" },
  { icon: "✍️", title: "Writing & Translation", skills: "Copywriting, Editing, Translation", slug: "writing-translation" },
  { icon: "🎬", title: "Video & Animation", skills: "Video Editing, Motion Graphics, Animation", slug: "video-animation" },
  { icon: "🎵", title: "Music & Audio", skills: "Voice Over, Mixing, Sound Design", slug: "music-audio" },
  { icon: "💻", title: "Programming & Tech", skills: "Web Development, Mobile Apps, DevOps", slug: "programming-tech" },
  { icon: "💼", title: "Business", skills: "Consulting, Market Research, Business Plans", slug: "business" },
  { icon: "🌿", title: "Lifestyle", skills: "Coaching, Wellness, Personal Development", slug: "lifestyle" },
  { icon: "📊", title: "Data", skills: "Data Analysis, Machine Learning, Visualization", slug: "data" },
  { icon: "📷", title: "Photography", skills: "Product Photography, Photo Editing, Retouching", slug: "photography" },
];

async function seed() {
  await mongoDB();

  for (const cat of CATEGORIES) {
    await CategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, new: true }
    );
  }

  const count = await CategoryModel.countDocuments();
  console.log(`Seeded ${count} categories.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
