import { DefinitionList } from "@/components/DefinitionList";
import type { Stakeholder, Participant } from "@/features/projects/api/types";
export function StakeholderDetails({
  stakeholder,
  participants,
}: {
  stakeholder: Stakeholder;
  participants: Participant[];
}) {
  const participant = participants.find(
    (row) => row.id === stakeholder.participantId,
  );
  return (
    <details>
      <summary className="cursor-pointer rounded-sm py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Show details<span className="sr-only"> for {stakeholder.name}</span>
      </summary>
      <DefinitionList
        items={[
          {
            id: "responsibilities",
            label: "Responsibilities",
            value: stakeholder.responsibilities,
          },
          { id: "email", label: "Email", value: stakeholder.email },
          {
            id: "participant",
            label: "Linked participant",
            value: participant?.displayName,
          },
        ]}
      />
    </details>
  );
}
