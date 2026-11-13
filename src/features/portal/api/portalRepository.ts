import type { PortalAdapter } from "@/features/portal/api/types";
import { mockPortalRepository } from "@/features/portal/api/mockPortalRepository";
export interface PortalRepository extends PortalAdapter {
  readonly kind: "mock" | "http";
}
export const getPortalRepository = (): PortalRepository => mockPortalRepository;
