export const CATEGORIES = ['Clothing','Electronics','Books','Home & Living','Furniture','Sports','Other'] as const;
export type Category = (typeof CATEGORIES)[number];
export const CONDITIONS = ['New','Like new','Good','Fair'] as const;
export type Condition = (typeof CONDITIONS)[number];
export type PublicUser = { id: string; name: string; email: string; phone: string; location: string; role: 'buyer'|'seller'|'admin'; createdAt: string };
export type Product = {
 id: string; title: string; description: string; category: Category; price: number;
 condition: Condition; images: string[]; sellerId: string; sellerName: string;
 sellerEmail: string; sellerPhone: string; location: string;
 status: 'available'|'sold'|'archived'; paymentStatus: 'unpaid'|'paid';
 createdAt: string; updatedAt: string; deletionRequestStatus?: 'pending'|'approved'|'rejected'|null;
};
export type DeletionRequest = { id: string; productId: string; productTitle: string; sellerName: string; sellerEmail: string; requestedBy: string; reason: string; status: 'pending'|'approved'|'rejected'; adminNote?: string; createdAt: string; reviewedAt?: string };
export type PaginatedProducts = { items: Product[]; page: number; pages: number; total: number };
