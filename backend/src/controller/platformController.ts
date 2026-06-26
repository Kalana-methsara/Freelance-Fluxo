import { Request, Response } from "express";
import { CategoryModel } from "../models/categoryModel";
import { UserModel } from "../models/userModel";
import { JobModel } from "../models/jobModel";
import { asyncHandler } from "../middleware/asyncHandler";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await CategoryModel.find().sort({ title: 1 });
  res.status(200).json({ success: true, data: categories });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });

  const jobs = await JobModel.find({ categoryId: category._id, status: "open" })
    .populate("clientId", "firstName lastName companyName")
    .limit(20);

  const freelancers = await UserModel.find({
    userRole: UserRole.FREELANCER,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: { $exists: true, $ne: [] },
  })
    .select("-password +bio +location")
    .limit(12);

  res.status(200).json({ success: true, data: { category, jobs, freelancers } });
});

export const getFreelancers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  const filter: Record<string, unknown> = {
    userRole: UserRole.FREELANCER,
    approvalStatus: ApprovalStatus.APPROVED,
  };

  if (q && typeof q === "string") {
    filter.$or = [
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { title: { $regex: q, $options: "i" } },
      { skills: { $elemMatch: { $regex: q, $options: "i" } } },
    ];
  }

  const freelancers = await UserModel.find(filter)
    .select("-password +bio +location")
    .sort({ rating: -1, reviewCount: -1 });

  res.status(200).json({ success: true, data: freelancers });
});

export const getFreelancerById = asyncHandler(async (req: Request, res: Response) => {
  const freelancer = await UserModel.findOne({
    _id: req.params.id,
    userRole: UserRole.FREELANCER,
    approvalStatus: ApprovalStatus.APPROVED,
  }).select("-password +bio +location");

  if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

  const completedJobs = await JobModel.find({
    freelancerId: freelancer._id,
    status: "completed",
  })
    .populate("clientId", "firstName lastName companyName")
    .limit(5);

  res.status(200).json({ success: true, data: { freelancer, completedJobs } });
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  const query = typeof q === "string" ? q : "";

  const [freelancers, jobs] = await Promise.all([
    UserModel.find({
      userRole: UserRole.FREELANCER,
      approvalStatus: ApprovalStatus.APPROVED,
      $or: query
        ? [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
            { skills: { $elemMatch: { $regex: query, $options: "i" } } },
          ]
        : [{}],
    })
      .select("-password +bio +location")
      .limit(20),
    JobModel.find({
      status: "open",
      ...(query
        ? {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
              { skills: { $elemMatch: { $regex: query, $options: "i" } } },
            ],
          }
        : {}),
    })
      .populate("clientId", "firstName lastName companyName")
      .limit(20),
  ]);

  res.status(200).json({ success: true, data: { freelancers, jobs, query } });
});
