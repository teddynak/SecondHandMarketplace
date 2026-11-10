export const CATEGORIES = ['Clothing','Electronics','Books','Home & Living','Furniture','Sports','Other'] as const;
export type Category = (typeof CATEGORIES)[number];
export type PublicUser = {accountStatus?:'active'|'suspended';suspensionReason?:string; id: string; name: string; email: string; phone: string; location: string; role: 'buyer'|'seller'|'admin'; createdAt: string };
export type Product = {
 id: string; title: string; description: string; category: Category; price: number;
 publiclyVisible?:boolean;moderationHidden?:boolean;moderationReason?:string;sellerSuspended?:boolean;usedOnlyEligible?: boolean; images: string[]; sellerId: string; sellerName: string;
 sellerEmail: string; sellerPhone: string; location: string;
 status: 'available'|'sold'|'archived'; paymentStatus: 'unpaid'|'paid';
 createdAt: string; updatedAt: string; deletionRequestStatus?: 'pending'|'approved'|'rejected'|null;
};
export type DeletionRequest = { id: string; productId: string; productTitle: string; sellerName: string; sellerEmail: string; requestedBy: string; reason: string; status: 'pending'|'approved'|'rejected'; adminNote?: string; createdAt: string; reviewedAt?: string };
export type PaginatedProducts = { items: Product[]; page: number; pages: number; total: number };
export type ConversationSummary={id:string;listingId:string;listingTitle:string;listingStatus:string;otherId:string;otherName:string;lastMessage:string;lastActivityAt:string;unread:number;blockedByMe:boolean;blocked:boolean;canSend:boolean;unavailableReason:string;sequence:number};
export type ChatMessage={id:string;senderId:string;text:string;sequence:number;clientId:string;createdAt:string};
