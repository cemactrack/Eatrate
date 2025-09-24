import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

// Mock data for admin reports management
type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
type ReportType = "user" | "restaurant" | "post" | "comment" | "other";
type ReportPriority = "low" | "medium" | "high" | "urgent";

interface MockReport {
  id: string;
  type: ReportType;
  targetId: string;
  targetType: string;
  reason: string;
  description: string | null;
  reporterName: string;
  reporterId: string;
  status: ReportStatus;
  priority: ReportPriority;
  createdAt: string;
  reviewedAt: string | null;
  resolvedAt: string | null;
  adminNotes: string | null;
  evidence: {
    screenshots: string[];
    additionalInfo: string;
  };
}

const mockReports: MockReport[] = [
  {
    id: "report-1",
    type: "post",
    targetId: "post-123",
    targetType: "Social Media Post",
    reason: "Inappropriate Content",
    description: "This post contains offensive language and inappropriate images that violate community guidelines.",
    reporterName: "Marie Dupont",
    reporterId: "user-456",
    status: "pending",
    priority: "high",
    createdAt: "2024-01-15T14:30:00Z",
    reviewedAt: null,
    resolvedAt: null,
    adminNotes: null,
    evidence: {
      screenshots: ["screenshot1.jpg", "screenshot2.jpg"],
      additionalInfo: "Multiple users have complained about this content.",
    },
  },
  {
    id: "report-2",
    type: "user",
    targetId: "user-789",
    targetType: "User Profile",
    reason: "Harassment",
    description: "This user has been sending threatening messages to multiple restaurant owners.",
    reporterName: "Jean Mballa",
    reporterId: "user-101",
    status: "reviewed",
    priority: "urgent",
    createdAt: "2024-01-14T09:15:00Z",
    reviewedAt: "2024-01-14T16:20:00Z",
    resolvedAt: null,
    adminNotes: "Confirmed harassment behavior. User has been temporarily suspended pending investigation.",
    evidence: {
      screenshots: ["harassment1.jpg", "harassment2.jpg", "harassment3.jpg"],
      additionalInfo: "Screenshots of threatening messages sent via private messages.",
    },
  },
  {
    id: "report-3",
    type: "restaurant",
    targetId: "rest-456",
    targetType: "Restaurant Listing",
    reason: "Fake Information",
    description: "This restaurant listing contains false information about location and services.",
    reporterName: "Paul Tabi",
    reporterId: "user-202",
    status: "resolved",
    priority: "medium",
    createdAt: "2024-01-12T11:45:00Z",
    reviewedAt: "2024-01-13T08:30:00Z",
    resolvedAt: "2024-01-13T14:15:00Z",
    adminNotes: "Verified with restaurant owner. Information has been corrected.",
    evidence: {
      screenshots: ["fake_info.jpg"],
      additionalInfo: "Restaurant owner confirmed the address was incorrect.",
    },
  },
  {
    id: "report-4",
    type: "comment",
    targetId: "comment-789",
    targetType: "Review Comment",
    reason: "Spam",
    description: "This comment is clearly spam and contains promotional links.",
    reporterName: "Alice Nguyen",
    reporterId: "user-303",
    status: "dismissed",
    priority: "low",
    createdAt: "2024-01-10T16:20:00Z",
    reviewedAt: "2024-01-11T10:15:00Z",
    resolvedAt: "2024-01-11T10:15:00Z",
    adminNotes: "Upon review, this appears to be a legitimate comment with a relevant link.",
    evidence: {
      screenshots: ["comment_spam.jpg"],
      additionalInfo: "User reported this as spam but it appears to be legitimate.",
    },
  },
  {
    id: "report-5",
    type: "other",
    targetId: "system-001",
    targetType: "Platform Issue",
    reason: "Technical Issue",
    description: "Users are experiencing login issues and cannot access their accounts.",
    reporterName: "System Monitor",
    reporterId: "system",
    status: "pending",
    priority: "urgent",
    createdAt: "2024-01-16T08:00:00Z",
    reviewedAt: null,
    resolvedAt: null,
    adminNotes: null,
    evidence: {
      screenshots: ["login_error.jpg"],
      additionalInfo: "Multiple users affected. Server logs show authentication service issues.",
    },
  },
];

export const getAdminReportsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(["pending", "reviewed", "resolved", "dismissed"]).optional(),
      type: z.enum(["user", "restaurant", "post", "comment", "other"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Reports] Fetching reports with filters:", input);
    
    let filteredReports = [...mockReports];
    
    // Filter by status
    if (input.status) {
      filteredReports = filteredReports.filter(report => report.status === input.status);
    }
    
    // Filter by type
    if (input.type) {
      filteredReports = filteredReports.filter(report => report.type === input.type);
    }
    
    // Filter by priority
    if (input.priority) {
      filteredReports = filteredReports.filter(report => report.priority === input.priority);
    }
    
    // Filter by search query
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredReports = filteredReports.filter(report => 
        report.reason.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        report.reporterName.toLowerCase().includes(searchLower) ||
        report.targetType.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by priority and creation date
    filteredReports.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply pagination
    const paginatedReports = filteredReports.slice(input.offset, input.offset + input.limit);
    
    return {
      reports: paginatedReports,
      total: filteredReports.length,
      hasMore: input.offset + input.limit < filteredReports.length,
      stats: {
        pending: mockReports.filter(r => r.status === "pending").length,
        reviewed: mockReports.filter(r => r.status === "reviewed").length,
        resolved: mockReports.filter(r => r.status === "resolved").length,
        dismissed: mockReports.filter(r => r.status === "dismissed").length,
      },
    };
  });

export const updateAdminReportProcedure = protectedProcedure
  .input(
    z.object({
      reportId: z.string(),
      status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
      adminNotes: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Reports] Updating report:", input);
    
    // In a real app, this would update the database
    const reportIndex = mockReports.findIndex(report => report.id === input.reportId);
    if (reportIndex === -1) {
      throw new Error("Report not found");
    }
    
    const now = new Date().toISOString();
    const updatedReport: MockReport = {
      ...mockReports[reportIndex],
      status: input.status,
      adminNotes: input.adminNotes || mockReports[reportIndex].adminNotes,
      priority: (input.priority || mockReports[reportIndex].priority) as ReportPriority,
      reviewedAt: input.status !== "pending" ? (mockReports[reportIndex].reviewedAt || now) : mockReports[reportIndex].reviewedAt,
      resolvedAt: (input.status === "resolved" || input.status === "dismissed") ? now : mockReports[reportIndex].resolvedAt,
    };
    mockReports[reportIndex] = updatedReport;
    
    return {
      success: true,
      report: updatedReport,
    };
  });

export const deleteAdminReportProcedure = protectedProcedure
  .input(
    z.object({
      reportId: z.string(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Reports] Deleting report:", input);
    
    // In a real app, this would delete from the database
    const reportIndex = mockReports.findIndex(report => report.id === input.reportId);
    if (reportIndex === -1) {
      throw new Error("Report not found");
    }
    
    const deletedReport = mockReports.splice(reportIndex, 1)[0];
    
    return {
      success: true,
      deletedReport,
    };
  });

export const getAdminReportDetailsProcedure = protectedProcedure
  .input(
    z.object({
      reportId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Reports] Fetching report details:", input.reportId);
    
    const report = mockReports.find(report => report.id === input.reportId);
    if (!report) {
      throw new Error("Report not found");
    }
    
    return {
      report,
      timeline: [
        {
          id: "1",
          action: "submitted",
          timestamp: report.createdAt,
          actor: report.reporterName,
          details: `Report submitted: ${report.reason}`,
        },
        ...(report.reviewedAt ? [{
          id: "2",
          action: "reviewed",
          timestamp: report.reviewedAt,
          actor: "Admin",
          details: report.adminNotes || "Report reviewed by admin",
        }] : []),
        ...(report.resolvedAt ? [{
          id: "3",
          action: report.status,
          timestamp: report.resolvedAt,
          actor: "Admin",
          details: `Report ${report.status}`,
        }] : []),
      ],
      relatedReports: mockReports.filter(r => 
        r.targetId === report.targetId && r.id !== report.id
      ).slice(0, 5),
    };
  });

export const bulkUpdateReportsProcedure = protectedProcedure
  .input(
    z.object({
      reportIds: z.string().array(),
      action: z.enum(["review", "resolve", "dismiss", "delete"]),
      adminNotes: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Reports] Bulk updating reports:", input);
    
    const updatedReports = [];
    const now = new Date().toISOString();
    
    for (const reportId of input.reportIds) {
      const reportIndex = mockReports.findIndex(report => report.id === reportId);
      if (reportIndex !== -1) {
        if (input.action === "delete") {
          const deletedReport = mockReports.splice(reportIndex, 1)[0];
          updatedReports.push(deletedReport);
        } else {
          const status = input.action === "review" ? "reviewed" : 
                       input.action === "resolve" ? "resolved" : "dismissed";
          
          const updatedReport: MockReport = {
            ...mockReports[reportIndex],
            status: status as ReportStatus,
            adminNotes: input.adminNotes || mockReports[reportIndex].adminNotes,
            priority: (input.priority || mockReports[reportIndex].priority) as ReportPriority,
            reviewedAt: (mockReports[reportIndex].reviewedAt || now),
            resolvedAt: (status === "resolved" || status === "dismissed") ? now : mockReports[reportIndex].resolvedAt,
          };
          mockReports[reportIndex] = updatedReport;
          updatedReports.push(updatedReport);
        }
      }
    }
    
    return {
      success: true,
      updatedCount: updatedReports.length,
      updatedReports,
    };
  });

export const getReportStatsProcedure = protectedProcedure
  .input(
    z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Reports] Fetching report stats:", input);
    
    // In a real app, this would query the database with date filters
    const now = new Date();
    const daysBack = input.timeRange === "7d" ? 7 : 
                    input.timeRange === "30d" ? 30 : 
                    input.timeRange === "90d" ? 90 : 365;
    
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const recentReports = mockReports.filter(report => 
      new Date(report.createdAt) >= cutoffDate
    );
    
    return {
      totalReports: recentReports.length,
      byStatus: {
        pending: recentReports.filter(r => r.status === "pending").length,
        reviewed: recentReports.filter(r => r.status === "reviewed").length,
        resolved: recentReports.filter(r => r.status === "resolved").length,
        dismissed: recentReports.filter(r => r.status === "dismissed").length,
      },
      byType: {
        user: recentReports.filter(r => r.type === "user").length,
        restaurant: recentReports.filter(r => r.type === "restaurant").length,
        post: recentReports.filter(r => r.type === "post").length,
        comment: recentReports.filter(r => r.type === "comment").length,
        other: recentReports.filter(r => r.type === "other").length,
      },
      byPriority: {
        urgent: recentReports.filter(r => r.priority === "urgent").length,
        high: recentReports.filter(r => r.priority === "high").length,
        medium: recentReports.filter(r => r.priority === "medium").length,
        low: recentReports.filter(r => r.priority === "low").length,
      },
      averageResolutionTime: "2.5 hours", // Mock data
      responseRate: 95.2, // Mock data
    };
  });