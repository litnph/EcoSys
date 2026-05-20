/**
 * Domain types cho feature `organizations`.
 *
 * Backend hiện chỉ trả về một số field qua `GET /api/v1/organizations`
 * (`GetMyOrganizationsResponse`). Các field FE-spec yêu cầu nhưng chưa có
 * trong list endpoint (`timezone`, `ownerId`, `isActive`) được khai báo
 * optional để dùng cho detail / mở rộng sau.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  defaultCurrency: string;
  /** Tuỳ chọn — chỉ trả về ở detail endpoint. */
  timezone?: string;
  /** Tuỳ chọn — chỉ trả về ở detail endpoint. */
  ownerId?: string;
  /** Tuỳ chọn — list endpoint hiện chỉ trả về org đang active. */
  isActive?: boolean;
  /** Vai trò của caller trong org (BE: `myRole`). */
  myRole?: string;
  /** Số thành viên active. */
  memberCount?: number;
  /** ISO 8601 UTC. */
  createdAt?: string;
}
