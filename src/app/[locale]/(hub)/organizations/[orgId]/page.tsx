import { OrganizationDetailView } from "@/features/organizations/components/OrganizationDetailView";

type OrganizationDetailPageProps = {
  params: { orgId: string };
};

export default function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  return <OrganizationDetailView orgId={params.orgId} />;
}
