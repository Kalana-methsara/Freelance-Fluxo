import { Request, Response } from "express";
import { JobModel } from "../models/jobModel";
import { ApplicationModel } from "../models/applicationModel";
import { UserModel } from "../models/userModel";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "../enums/userRole";

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, status } = req.query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (category) filter.categoryId = category;

  if (q && typeof q === "string") {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { skills: { $elemMatch: { $regex: q, $options: "i" } } },
    ];
  } else if (!status) {
    filter.status = { $in: ["open", "in_progress"] };
  }

  const jobs = await JobModel.find(filter)
    .populate("clientId", "firstName lastName companyName email")
    .populate("freelancerId", "firstName lastName title")
    .populate("categoryId", "title icon")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: jobs });
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await JobModel.findById(req.params.id)
    .populate("clientId", "firstName lastName companyName email")
    .populate("freelancerId", "firstName lastName title skills hourlyRate rating reviewCount")
    .populate("categoryId", "title icon");

  if (!job) return res.status(404).json({ message: "Job not found" });
  res.status(200).json({ success: true, data: job });
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { title, description, budget, deadline, categoryId, skills, status } = req.body;

  const job = await JobModel.create({
    title,
    description,
    budget,
    deadline: new Date(deadline),
    categoryId,
    skills: skills || [],
    status: status || "open",
    clientId: authReq.user!._id,
  });

  const populated = await JobModel.findById(job._id)
    .populate("clientId", "firstName lastName companyName")
    .populate("categoryId", "title icon");

  res.status(201).json({ success: true, data: populated });
});

export const applyToJob = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { bid, coverLetter } = req.body;
  const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const freelancer = await UserModel.findById(authReq.user!._id);
  if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

  if (!freelancer.title || !freelancer.title.trim()) {
    return res.status(400).json({ message: "Complete your profile title before applying." });
  }

  if (!freelancer.skills || freelancer.skills.length === 0) {
    return res.status(400).json({ message: "Add at least one skill to your profile before applying." });
  }

  if (!freelancer.hourlyRate || freelancer.hourlyRate <= 0) {
    return res.status(400).json({ message: "Set a valid hourly rate before applying." });
  }

  if (
    !freelancer.location ||
    !freelancer.location.address ||
    !freelancer.location.city ||
    !freelancer.location.province ||
    !freelancer.location.country ||
    !freelancer.location.coordinates ||
    freelancer.location.coordinates.lat == null ||
    freelancer.location.coordinates.lng == null
  ) {
    return res.status(400).json({ message: "Complete your profile location before applying." });
  }

  const job = await JobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.status !== "open") {
    return res.status(400).json({ message: "This job is not accepting applications" });
  }

  const existing = await ApplicationModel.findOne({
    jobId: jobId,
    freelancerId: authReq.user!._id,
  });
  if (existing) {
    return res.status(400).json({ message: "You have already applied to this job" });
  }

  const application = await ApplicationModel.create({
    jobId,
    freelancerId: authReq.user!._id,
    bid,
    coverLetter,
  });

  const populated = await ApplicationModel.findById(application._id)
    .populate("jobId", "title budget status")
    .populate("freelancerId", "firstName lastName title");

  res.status(201).json({ success: true, data: populated });
});

export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const applications = await ApplicationModel.find({ freelancerId: authReq.user!._id })
    .populate({
      path: "jobId",
      populate: { path: "clientId", select: "firstName lastName companyName" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: applications });
});

export const getJobApplications = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const job = await JobModel.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.clientId.toString() !== authReq.user!._id) {
    return res.status(403).json({ message: "Not authorized to view applications" });
  }

  const applications = await ApplicationModel.find({ jobId: job._id })
    .populate("freelancerId", "firstName lastName title skills hourlyRate rating reviewCount")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: applications });
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { status } = req.body;
  const application = await ApplicationModel.findById(req.params.id).populate("jobId");

  if (!application) return res.status(404).json({ message: "Application not found" });

  const job = application.jobId as unknown as { clientId: { toString: () => string }; _id: string };
  if (job.clientId.toString() !== authReq.user!._id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  application.status = status;
  await application.save();

  if (status === "accepted") {
    await JobModel.findByIdAndUpdate(job._id, {
      freelancerId: application.freelancerId,
      status: "in_progress",
    });
    await ApplicationModel.updateMany(
      { jobId: job._id, _id: { $ne: application._id } },
      { status: "rejected" }
    );
  }

  res.status(200).json({ success: true, data: application });
});

export const getClientJobs = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const jobs = await JobModel.find({ clientId: authReq.user!._id })
    .populate("freelancerId", "firstName lastName title")
    .populate("categoryId", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: jobs });
});

export const getFreelancerJobs = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const jobs = await JobModel.find({ freelancerId: authReq.user!._id })
    .populate("clientId", "firstName lastName companyName")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: jobs });
});
