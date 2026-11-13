import { useState, useId } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DefinitionList } from "@/components/DefinitionList";
import { FormDialogFeedback } from "@/components/FormDialogFeedback";
import type { ProjectDetail } from "@/features/projects/api/types";
import type { ProjectSettingsActions } from "@/features/projects/model/useProjectSettingsActions";
const weeks = [1, 2, 3, 4] as const;
export function CadenceCard({
  project,
  actions,
}: {
  project: ProjectDetail;
  actions: ProjectSettingsActions;
}) {
  const id = useId(),
    [intent, setIntent] = useState<{ weeks: 1 | 2 | 3 | 4; version: number }>(),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false);
  const value = intent?.weeks ?? project.sprintLengthWeeks;
  async function reload() {
    setPending(true);
    try {
      const result = await actions.reload();
      setIntent({
        weeks: result.project.sprintLengthWeeks,
        version: result.project.version,
      });
      setError(undefined);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <section aria-label="Cadence">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Cadence</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DefinitionList
            items={[
              { id: "framework", label: "Framework", value: "Scrum" },
              ...(!project.permissions.editCadence
                ? [
                    {
                      id: "sprint-length",
                      label: "Sprint length",
                      value: `${String(project.sprintLengthWeeks)} ${project.sprintLengthWeeks === 1 ? "week" : "weeks"}`,
                    },
                  ]
                : []),
            ]}
          />
          {project.permissions.editCadence ? (
            <form
              noValidate
              className="flex min-w-0 flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!intent || pending) return;
                setPending(true);
                setError(undefined);
                void actions
                  .run({
                    action: "setSprintLength",
                    weeks: intent.weeks,
                    expectedVersion: intent.version,
                  })
                  .then((result) => {
                    if (result === "done") setIntent(undefined);
                  })
                  .catch((failure: unknown) => {
                    setError(failure);
                  })
                  .finally(() => {
                    setPending(false);
                  });
              }}
            >
              <FormDialogFeedback
                error={error}
                pending={pending}
                onReload={() => {
                  void reload();
                }}
              />
              <Label htmlFor={id}>Sprint length</Label>
              <Select
                value={String(value)}
                disabled={pending}
                onValueChange={(next) => {
                  const selected = weeks.find((week) => String(week) === next);
                  if (selected)
                    setIntent((current) => ({
                      weeks: selected,
                      version: current?.version ?? project.version,
                    }));
                }}
              >
                <SelectTrigger id={id} aria-describedby={`${id}-help`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {weeks.map((week) => (
                      <SelectItem key={week} value={String(week)}>
                        {week} {week === 1 ? "week" : "weeks"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                type="submit"
                disabled={
                  pending || !intent || value === project.sprintLengthWeeks
                }
              >
                {pending ? "Saving…" : "Save"}
              </Button>
            </form>
          ) : null}
          <p id={`${id}-help`} className="text-sm text-muted-foreground">
            A change applies only to Sprints that have not started.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
