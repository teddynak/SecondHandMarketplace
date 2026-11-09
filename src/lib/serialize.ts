import type { Product, DeletionRequest as RequestView } from '@/types';
import type { IProduct } from '@/models/Product';
import type { IDeletionRequest } from '@/models/DeletionRequest';
export function productDto(p: IProduct & { _id: unknown }, requestStatus: Product['deletionRequestStatus'] = null): Product {
 return {
  id: String(p._id), title: p.title, description: p.description, category: p.category as Product['category'],
  price: p.price, condition: p.condition as Product['condition'], images: p.images,
  sellerId: String(p.sellerId), sellerName: p.sellerName, sellerEmail: p.sellerEmail,
  sellerPhone: p.sellerPhone, location: p.location, status: p.status, paymentStatus: p.paymentStatus,
  createdAt: new Date(p.createdAt).toISOString(), updatedAt: new Date(p.updatedAt).toISOString(), deletionRequestStatus: requestStatus
 };
}
export function deletionDto(r: IDeletionRequest & { _id: unknown }, product: {title: string}|null, seller: {name: string; email: string}|null): RequestView {
 return { id: String(r._id), productId: String(r.productId), productTitle: product?.title ?? '(removed listing)',
 sellerName: seller?.name ?? '(unknown)', sellerEmail: seller?.email ?? '',
 requestedBy: String(r.requestedBy), reason: r.reason, status: r.status,
 adminNote: r.adminNote, createdAt: new Date(r.createdAt).toISOString(), reviewedAt: r.reviewedAt?.toISOString() };
}
