import type { Product } from '@/types';
export function listingStatusDescription(item:Pick<Product,'status'|'paymentStatus'|'deletionRequestStatus'|'usedOnlyEligible'>){
 if(item.usedOnlyEligible===false&&item.status==='available')return 'Hidden from buyers because this older listing was marked new. Only used items are accepted. Edit and relist only after the item has been used.';
 if(item.status==='archived')return 'Archived after administrator approval. This listing is hidden from buyers and can no longer be edited.';
 if(item.status==='sold')return `Sold listings are hidden from buyers and cannot be edited. ${item.paymentStatus==='paid'?'Payment is recorded as received.':'You can mark payment received once the buyer has paid.'}${item.deletionRequestStatus==='pending'?' A removal request is awaiting administrator review.':''}`;
 if(item.deletionRequestStatus==='pending')return 'Removal is awaiting administrator review. The listing stays available until approved or marked sold; you can still edit it.';
 return 'Available to buyers. You can edit this listing or confirm a completed sale.';
}
