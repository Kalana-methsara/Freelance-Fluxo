import { Request, Response } from "express";
import { JobModel } from "../models/jobModel";
import { ApplicationModel } from "../models/applicationModel";
import { UserModel } from "../models/userModel";
import { ReportModel } from "../models/reportModel";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";

const monthLabel = (date: Date) =>
  date.toLocaleString("en-US", { month: "short" });

export const getFreelancerDashboard = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!._id;

  const [user, activeJobs, proposals, completedJobs] = await Promise.all([
    UserModel.findById(userId).select("-password"),
    JobModel.find({ freelancerId: userId, status: { $in: ["in_progress", "under_review"] } })
      .populate("clientId", "firstName lastName companyName")
      .sort({ deadline: 1 }),
    ApplicationModel.find({ freelancerId: userId })
      .populate({ path: "jobId", select: "title budget status" })
      .sort({ createdAt: -1 })
      .limit(10),
    JobModel.find({ freelancerId: userId, status: "completed" }),
  ]);

  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.spent || j.budget), 0);
  const earningsMap = new Map<string, number>();

  completedJobs.forEach((job) => {
    const label = monthLabel(job.updatedAt);
    earningsMap.set(label, (earningsMap.get(label) || 0) + (job.spent || job.budget));
  });

  const earnings = Array.from(earningsMap.entries()).map(([month, amount]) => ({ month, amount }));

  res.status(200).json({
    success: true,
    data: {
      user,
      stats: {
        totalEarnings,
        activeJobs: activeJobs.length,
        openProposals: proposals.filter((p) => p.status === "pending").length,
        profileViews: user?.reviewCount || 0,
      },
      activeJobs,
      proposals,
      earnings,
    },
  });
});

export const getClientDashboard = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!._id;

  const [user, projects, applications] = await Promise.all([
    UserModel.findById(userId).select("-password"),
    JobModel.find({ clientId: userId })
      .populate("freelancerId", "firstName lastName title rating")
      .sort({ createdAt: -1 }),
    ApplicationModel.find({})
      .populate({
        path: "jobId",
        match: { clientId: userId },
        select: "title clientId",
      })
      .populate("freelancerId", "firstName lastName title rating reviewCount")
      .sort({ createdAt: -1 }),
  ]);

  const applicants = applications.filter((a) => a.jobId);
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const invoices = projects
    .filter((p) => p.spent > 0)
    .map((p) => ({
      _id: p._id,
      freelancer: p.freelancerId,
      project: p.title,
      amount: p.spent,
      date: p.updatedAt,
      paid: p.status === "completed",
    }));

  res.status(200).json({
    success: true,
    data: {
      user,
      stats: {
        totalBudget,
        totalSpent,
        activeProjects: projects.filter((p) => ["open", "in_progress", "under_review"].includes(p.status)).length,
        pendingInvoices: invoices.filter((i) => !i.paid).length,
      },
      projects,
      applicants,
      invoices,
    },
  });
});

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [users, jobs, reports] = await Promise.all([
    UserModel.find().select("-password").sort({ createdAt: -1 }).limit(10),
    JobModel.find().populate("clientId", "firstName lastName companyName").sort({ createdAt: -1 }).limit(10),
    ReportModel.find().sort({ createdAt: -1 }).limit(10),
  ]);

  const [totalUsers, totalJobs, openReports, flaggedJobs, roleBreakdown, statusBreakdown] = await Promise.all([
    UserModel.countDocuments(),
    JobModel.countDocuments(),
    ReportModel.countDocuments({ resolved: false }),
    JobModel.countDocuments({ status: "flagged" }),
    UserModel.aggregate([
      { $unwind: "$userRole" },
      { $group: { _id: "$userRole", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    JobModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  const [userCounts, jobCounts] = await Promise.all([
    UserModel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
    JobModel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const monthlyStats = userCounts.map((u) => ({
    month: u._id,
    users: u.count,
    jobs: jobCounts.find((j) => j._id === u._id)?.count || 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      stats: { totalUsers, totalJobs, openReports, flaggedJobs },
      recentUsers: users,
      recentJobs: jobs,
      reports,
      monthlyStats,
      roleBreakdown: roleBreakdown.map((item) => ({ role: item._id, count: item.count })),
      statusBreakdown: statusBreakdown.map((item) => ({ status: item._id, count: item.count })),
    },
  });
});
