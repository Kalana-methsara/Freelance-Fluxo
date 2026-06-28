import { Request, Response } from "express";
import { JobModel } from "../models/jobModel";
import { ApplicationModel } from "../models/applicationModel";
import { SubmissionModel } from "../models/submissionModel";
import { UserModel } from "../models/userModel";
import cloudinary from "../config/cloudinary";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";

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
    !freelancer.location.address?.trim() ||
    !freelancer.location.city?.trim() ||
    !freelancer.location.province?.trim() ||
    !freelancer.location.country?.trim()
  ) {
    return res.status(400).json({ message: "Complete your profile location before applying." });
  }

  if (!bid || bid <= 0) {
    return res.status(400).json({ message: "A valid bid amount is required." });
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
    .populate("freelancerId", "firstName lastName title skills hourlyRate rating reviewCount profileImage")
    .populate("jobId", "title budget status")
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

export const withdrawApplication = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const application = await ApplicationModel.findById(req.params.id);

  if (!application) return res.status(404).json({ message: "Application not found" });
  if (application.freelancerId.toString() !== authReq.user!._id) {
    return res.status(403).json({ message: "Not authorized to withdraw this proposal" });
  }
  if (!["pending", "shortlisted"].includes(application.status)) {
    return res.status(400).json({ message: "Only pending or shortlisted proposals can be withdrawn" });
  }

  application.status = "withdrawn";
  await application.save();

  res.status(200).json({ success: true, data: application });
});

export const submitWork = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { description } = req.body;
  const file = req.file;

  if (!description?.trim()) {
    return res.status(400).json({ message: "Description is required" });
  }
  if (!file) {
    return res.status(400).json({ message: "File attachment is required" });
  }

  const job = await JobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.freelancerId?.toString() !== authReq.user!._id) {
    return res.status(403).json({ message: "Only the assigned freelancer can submit work" });
  }
  if (!["in_progress", "under_review"].includes(job.status)) {
    return res.status(400).json({ message: "This job is not accepting submissions" });
  }

  const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
    folder: "work_submissions",
    resource_type: "auto",
  });

  const submission = await SubmissionModel.create({
    jobId,
    freelancerId: authReq.user!._id,
    description: description.trim(),
    fileUrl: uploadResponse.secure_url,
    fileName: file.originalname,
  });

  job.status = "under_review";
  await job.save();

  res.status(201).json({ success: true, data: submission });
});

export const hireApplicant = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { applicationId } = req.body;

  if (!applicationId) return res.status(400).json({ message: 'applicationId is required' });

  const session = await JobModel.db.startSession();
  let conversation: any = null;

  try {
    await session.withTransaction(async () => {
      const job = await JobModel.findById(jobId).session(session);
      if (!job) throw new Error('Job not found');

      if (job.clientId.toString() !== authReq.user!._id.toString()) {
        throw new Error('Not authorized to hire for this job');
      }

      const application = await ApplicationModel.findById(applicationId).session(session);
      if (!application) throw new Error('Application not found');
      if (application.jobId.toString() !== job._id.toString()) throw new Error('Application does not belong to this job');

      application.status = 'accepted';
      await application.save({ session });

      await ApplicationModel.updateMany(
        { jobId: job._id, _id: { $ne: application._id } },
        { status: 'rejected' },
        { session }
      );

      job.status = 'in_progress';
      job.freelancerId = application.freelancerId;
      await job.save({ session });

      const clientId = job.clientId;
      const freelancerId = application.freelancerId;

      conversation = await (await import('../models/conversationModel')).ConversationModel.findOne({
        participants: { $all: [clientId, freelancerId] },
        jobId: job._id,
      }).session(session);

      if (!conversation) {
        const created = await (await import('../models/conversationModel')).ConversationModel.create([
          {
            participants: [clientId, freelancerId],
            jobId: job._id,
            type: 'direct',
            createdBy: authReq.user!._id,
            lastMessage: {
              text: 'Contract initiated! Job status updated to In Progress.',
              senderId: authReq.user!._id,
              createdAt: new Date(),
            },
          },
        ], { session });

        conversation = created[0];
      } else {
        conversation.lastMessage = {
          text: 'Contract initiated! Job status updated to In Progress.',
          senderId: authReq.user!._id,
          createdAt: new Date(),
        };
        await conversation.save({ session });
      }

      await (await import('../models/messageModel')).MessageModel.create([
        {
          conversationId: conversation._id,
          senderId: authReq.user!._id,
          text: 'Contract initiated! Job status updated to In Progress.',
          readBy: [authReq.user!._id],
        },
      ], { session });
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    if (err.message === 'Job not found') return res.status(404).json({ message: err.message });
    if (err.message === 'Not authorized to hire for this job') return res.status(403).json({ message: err.message });
    if (err.message === 'Application not found' || err.message === 'Application does not belong to this job') return res.status(400).json({ message: err.message });
    console.error('hireApplicant error:', err);
    return res.status(500).json({ message: 'Failed to hire applicant' });
  }

  session.endSession();

  const ConversationModel = (await import('../models/conversationModel')).ConversationModel;
  const populated = await ConversationModel.findById(conversation._id).populate('participants', 'firstName lastName profileImage userRole').lean();
  const participantIds = (populated?.participants || []).map((p: any) => (p._id || p).toString());

  try {
    const io = (req.app as any).locals?.io;
    if (io) {
      io.emit('contract_created', {
        userId: participantIds,
        conversationId: conversation._id,
        jobId,
      });
    }
  } catch (emitErr) {
    console.error('Failed to emit contract_created', emitErr);
  }

  res.status(200).json({ success: true, data: { conversation: populated } });
});
