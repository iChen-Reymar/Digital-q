import { StaffDesk } from "@/components/staff-desk";
import { SetupNotice } from "@/components/setup-notice";
import { messageFor } from "@/lib/messages";
import { getStaffDesk } from "@/server/queries";

export const metadata = { title: "Staff desk" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ counter?: string }>;
}) {
  const { counter } = await searchParams;

  try {
    const result = await getStaffDesk(counter ?? null);
    if (!result.ok) return <SetupNotice detail={messageFor(result.error)} />;
    return <StaffDesk key={result.counter_id ?? "none"} initial={result} />;
  } catch {
    return <SetupNotice />;
  }
}
