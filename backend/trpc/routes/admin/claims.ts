import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

// Mock data for admin claims management
type ClaimStatus = "pending" | "approved" | "rejected";
type ClaimPriority = "low" | "medium" | "high" | "urgent";

interface MockClaim {
  id: string;
  restaurant: {
    id: string;
    name: string;
    location: string;
    image: string;
  };
  claimant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: ClaimStatus;
  description: string;
  documents: {
    name: string;
    url: string;
    type: string;
  }[];
  submittedAt: string;
  reviewedAt: string | null;
  adminNotes: string | null;
  priority: ClaimPriority;
}

const mockClaims: MockClaim[] = [
  {
    id: "claim-1",
    restaurant: {
      id: "rest-1",
      name: "Le Bistro Camerounais",
      location: "Douala, Cameroon",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    },
    claimant: {
      id: "user-1",
      name: "Jean Mballa",
      email: "jean@example.com",
      phone: "+237 6XX XXX XXX",
    },
    status: "pending" as const,
    description: "I am the owner of this restaurant and would like to claim it to manage the listing and respond to reviews.",
    documents: [
      { name: "Business License.pdf", url: "#", type: "license" },
      { name: "Tax Certificate.pdf", url: "#", type: "tax" },
      { name: "ID Card.pdf", url: "#", type: "identity" },
    ],
    submittedAt: "2024-01-15T10:30:00Z",
    reviewedAt: null,
    adminNotes: null,
    priority: "medium" as const,
  },
  {
    id: "claim-2",
    restaurant: {
      id: "rest-2",
      name: "Chez Wou Restaurant",
      location: "Yaoundé, Cameroon",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    },
    claimant: {
      id: "user-2",
      name: "Marie Nguyen",
      email: "marie@example.com",
      phone: "+237 6XX XXX XXX",
    },
    status: "approved" as const,
    description: "This is my family restaurant that has been operating for 15 years. I need to update the menu and hours.",
    documents: [
      { name: "Restaurant Permit.pdf", url: "#", type: "permit" },
      { name: "Health Certificate.pdf", url: "#", type: "health" },
    ],
    submittedAt: "2024-01-10T14:20:00Z",
    reviewedAt: "2024-01-12T09:15:00Z",
    adminNotes: "All documents verified. Ownership confirmed.",
    priority: "high" as const,
  },
  {
    id: "claim-3",
    restaurant: {
      id: "rest-3",
      name: "Poisson Braisé Express",
      location: "Buea, Cameroon",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    },
    claimant: {
      id: "user-3",
      name: "Paul Tabi",
      email: "paul@example.com",
      phone: "+237 6XX XXX XXX",
    },
    status: "rejected" as const,
    description: "I want to claim this restaurant listing.",
    documents: [
      { name: "ID Card.pdf", url: "#", type: "identity" },
    ],
    submittedAt: "2024-01-08T16:45:00Z",
    reviewedAt: "2024-01-09T11:30:00Z",
    adminNotes: "Insufficient documentation. Unable to verify ownership.",
    priority: "low" as const,
  },
];

export const getAdminClaimsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Claims] Fetching claims with filters:", input);
    
    let filteredClaims = [...mockClaims];
    
    // Filter by status
    if (input.status) {
      filteredClaims = filteredClaims.filter(claim => claim.status === input.status);
    }
    
    // Filter by search query
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredClaims = filteredClaims.filter(claim => 
        claim.restaurant.name.toLowerCase().includes(searchLower) ||
        claim.claimant.name.toLowerCase().includes(searchLower) ||
        claim.claimant.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const paginatedClaims = filteredClaims.slice(input.offset, input.offset + input.limit);
    
    return {
      claims: paginatedClaims,
      total: filteredClaims.length,
      hasMore: input.offset + input.limit < filteredClaims.length,
    };
  });

export const updateAdminClaimProcedure = protectedProcedure
  .input(
    z.object({
      claimId: z.string(),
      status: z.enum(["pending", "approved", "rejected"]),
      adminNotes: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Claims] Updating claim:", input);
    
    // In a real app, this would update the database
    const claimIndex = mockClaims.findIndex(claim => claim.id === input.claimId);
    if (claimIndex === -1) {
      throw new Error("Claim not found");
    }
    
    const updatedClaim: MockClaim = {
      ...mockClaims[claimIndex],
      status: input.status,
      adminNotes: input.adminNotes || mockClaims[claimIndex].adminNotes,
      priority: (input.priority || mockClaims[claimIndex].priority) as ClaimPriority,
      reviewedAt: new Date().toISOString(),
    };
    mockClaims[claimIndex] = updatedClaim;
    
    return {
      success: true,
      claim: updatedClaim,
    };
  });

export const deleteAdminClaimProcedure = protectedProcedure
  .input(
    z.object({
      claimId: z.string(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Claims] Deleting claim:", input);
    
    // In a real app, this would delete from the database
    const claimIndex = mockClaims.findIndex(claim => claim.id === input.claimId);
    if (claimIndex === -1) {
      throw new Error("Claim not found");
    }
    
    const deletedClaim = mockClaims.splice(claimIndex, 1)[0];
    
    return {
      success: true,
      deletedClaim,
    };
  });

export const getAdminClaimDetailsProcedure = protectedProcedure
  .input(
    z.object({
      claimId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Claims] Fetching claim details:", input.claimId);
    
    const claim = mockClaims.find(claim => claim.id === input.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }
    
    return {
      claim,
      timeline: [
        {
          id: "1",
          action: "submitted",
          timestamp: claim.submittedAt,
          actor: claim.claimant.name,
          details: "Claim submitted with supporting documents",
        },
        ...(claim.reviewedAt ? [{
          id: "2",
          action: claim.status,
          timestamp: claim.reviewedAt,
          actor: "Admin",
          details: claim.adminNotes || `Claim ${claim.status}`,
        }] : []),
      ],
    };
  });

export const bulkUpdateClaimsProcedure = protectedProcedure
  .input(
    z.object({
      claimIds: z.array(z.string()),
      action: z.enum(["approve", "reject", "delete"]),
      adminNotes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Claims] Bulk updating claims:", input);
    
    const updatedClaims = [];
    
    for (const claimId of input.claimIds) {
      const claimIndex = mockClaims.findIndex(claim => claim.id === claimId);
      if (claimIndex !== -1) {
        if (input.action === "delete") {
          const deletedClaim = mockClaims.splice(claimIndex, 1)[0];
          updatedClaims.push(deletedClaim);
        } else {
          const status = input.action === "approve" ? "approved" : "rejected";
          const updatedClaim: MockClaim = {
            ...mockClaims[claimIndex],
            status: status as ClaimStatus,
            adminNotes: input.adminNotes || mockClaims[claimIndex].adminNotes,
            reviewedAt: new Date().toISOString(),
          };
          mockClaims[claimIndex] = updatedClaim;
          updatedClaims.push(mockClaims[claimIndex]);
        }
      }
    }
    
    return {
      success: true,
      updatedCount: updatedClaims.length,
      updatedClaims,
    };
  });