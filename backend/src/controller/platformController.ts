import { Request, Response } from "express";
import { CategoryModel } from "../models/categoryModel";
import { UserModel } from "../models/userModel";
import { JobModel } from "../models/jobModel";
import { asyncHandler } from "../middleware/asyncHandler";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
};

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
    .select("-password")
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
    .select("-password")
    .sort({ rating: -1, reviewCount: -1 });

  res.status(200).json({ success: true, data: freelancers });
});

export const getFreelancerById = asyncHandler(async (req: Request, res: Response) => {
  const freelancer = await UserModel.findOne({
    _id: req.params.id,
    userRole: UserRole.FREELANCER,
    approvalStatus: ApprovalStatus.APPROVED,
  }).select("-password");

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
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const type = typeof req.query.type === "string" ? req.query.type : "all";
  const skills = parseStringArray(req.query.skills);
  const minBudget = toNumber(req.query.minBudget);
  const maxBudget = toNumber(req.query.maxBudget);
  const minRate = toNumber(req.query.minRate);
  const maxRate = toNumber(req.query.maxRate);
  const ratingMin = toNumber(req.query.ratingMin);
  const location = typeof req.query.location === "string" ? req.query.location.trim() : "";

  const freelancerFilter: Record<string, unknown> = {
    userRole: UserRole.FREELANCER,
    approvalStatus: ApprovalStatus.APPROVED,
  };
  const jobFilter: Record<string, unknown> = { status: "open" };

  const addTextSearch = (filter: Record<string, unknown>, fields: Array<{ [key: string]: unknown }>) => {
    if (query) {
      filter.$or = fields;
    }
  };

  addTextSearch(freelancerFilter, [
    { firstName: { $regex: query, $options: "i" } },
    { lastName: { $regex: query, $options: "i" } },
    { title: { $regex: query, $options: "i" } },
    { skills: { $elemMatch: { $regex: query, $options: "i" } } },
  ]);

  addTextSearch(jobFilter, [
    { title: { $regex: query, $options: "i" } },
    { description: { $regex: query, $options: "i" } },
    { skills: { $elemMatch: { $regex: query, $options: "i" } } },
  ]);

  if (skills.length) {
    freelancerFilter.$and = skills.map((skill) => ({ skills: { $elemMatch: { $regex: skill, $options: "i" } } }));
    jobFilter.$and = skills.map((skill) => ({ skills: { $elemMatch: { $regex: skill, $options: "i" } } }));
  }

  if (typeof minBudget === "number") {
    jobFilter.budget = { ...(jobFilter.budget as Record<string, number> | undefined), $gte: minBudget };
  }
  if (typeof maxBudget === "number") {
    jobFilter.budget = { ...(jobFilter.budget as Record<string, number> | undefined), $lte: maxBudget };
  }
  if (typeof minRate === "number") {
    freelancerFilter.hourlyRate = { ...(freelancerFilter.hourlyRate as Record<string, number> | undefined), $gte: minRate };
  }
  if (typeof maxRate === "number") {
    freelancerFilter.hourlyRate = { ...(freelancerFilter.hourlyRate as Record<string, number> | undefined), $lte: maxRate };
  }
  if (typeof ratingMin === "number") {
    freelancerFilter.rating = { ...(freelancerFilter.rating as Record<string, number> | undefined), $gte: ratingMin };
  }
  if (location) {
    freelancerFilter.$or = [
      ...(freelancerFilter.$or ? [freelancerFilter.$or] : []),
      { "location.city": { $regex: location, $options: "i" } },
      { "location.address": { $regex: location, $options: "i" } },
      { "location.country": { $regex: location, $options: "i" } },
    ];
  }

  const promises: Promise<unknown>[] = [];
  let freelancers: unknown[] = [];
  let jobs: unknown[] = [];

  if (type === "freelancers" || type === "all") {
    promises.push(
      UserModel.find(freelancerFilter)
        .select("-password")
        .sort({ rating: -1, reviewCount: -1 })
        .limit(24)
        .then((result) => {
          freelancers = result;
        })
    );
  }

  if (type === "jobs" || type === "all") {
    promises.push(
      JobModel.find(jobFilter)
        .populate("clientId", "firstName lastName companyName")
        .sort({ budget: -1, createdAt: -1 })
        .limit(24)
        .then((result) => {
          jobs = result;
        })
    );
  }

  await Promise.all(promises);

  res.status(200).json({ success: true, data: { freelancers, jobs, query, filters: { skills, minBudget, maxBudget, minRate, maxRate, ratingMin, location, type } } });
});
