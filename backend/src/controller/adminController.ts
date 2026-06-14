// controllers/adminController.ts
import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import { JobModel } from "../models/jobModel";
import { ReportModel } from "../models/reportModel";
import { asyncHandler } from "../middleware/asyncHandler";

export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
    const [totalUsers, totalJobs, openReports, flaggedJobs, recentUsers, recentJobs, reports] = await Promise.all([
        UserModel.countDocuments(),
        JobModel.countDocuments(),
        ReportModel.countDocuments({ resolved: false }),
        JobModel.countDocuments({ flagged: true }),
        UserModel.find().select("-password").sort({ createdAt: -1 }).limit(5).lean(),
        JobModel.find().populate("clientId", "firstName companyName").sort({ createdAt: -1 }).limit(5).lean(),
        ReportModel.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalJobs,
            openReports,
            flaggedJobs,
            recentUsers: recentUsers.map(u => ({ ...u, createdAt: u.createdAt })),
            recentJobs: recentJobs.map(j => ({ ...j, createdAt: j.createdAt })),
            reports: reports.map(r => ({ ...r, createdAt: r.createdAt })),
        },
    });
});

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const filter: any = {};
    if (status) filter.status = status;

    const [jobs, total] = await Promise.all([
        JobModel.find(filter)
            .populate("clientId", "firstName companyName email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        JobModel.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, jobs, total, page, pages: Math.ceil(total / limit) });
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await JobModel.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    await job.deleteOne();
    res.status(200).json({ success: true, message: "Job deleted" });
});

export const flagJob = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const job = await JobModel.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    job.flagged = true;
    job.flagReason = reason;
    job.flaggedAt = new Date();
    await job.save();
    res.status(200).json({ success: true, message: "Job flagged" });
});

export const getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const resolved = req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : undefined;
    const filter: any = {};
    if (resolved !== undefined) filter.resolved = resolved;

    const [reports, total] = await Promise.all([
        ReportModel.find(filter)
            .populate("reportedBy", "firstName lastName email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ReportModel.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, reports, total, page, pages: Math.ceil(total / limit) });
});

export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportModel.findById(req.params.reportId);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    report.resolved = true;
    report.resolvedAt = new Date();
    report.resolvedBy = (req as any).user?._id;
    await report.save();
    res.status(200).json({ success: true, message: "Report resolved" });
});