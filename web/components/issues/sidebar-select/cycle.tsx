import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
// hooks
import useUser from "hooks/use-user";
// ui
import { Spinner, CustomSelect, Tooltip } from "components/ui";
// helper
import { truncateText } from "helpers/string.helper";
// types
import { ICycle, IIssue } from "types";
// fetch-keys
import { CYCLE_ISSUES, INCOMPLETE_CYCLES_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  issueDetails: IIssue | undefined;
  disabled?: boolean;
};

export const SidebarCycleSelect: React.FC<Props> = ({ issueDetails, disabled = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? INCOMPLETE_CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          cyclesService.getCyclesWithParams(
            workspaceSlug as string,
            projectId as string,
            "incomplete"
          )
      : null
  );

  const handleCycleChange = (cycleDetails: ICycle) => {
    if (!workspaceSlug || !projectId || !issueDetails) return;

    issuesService
      .addIssueToCycle(
        workspaceSlug as string,
        projectId as string,
        cycleDetails.id,
        {
          issues: [issueDetails.id],
        },
        user
      )
      .then((res) => {
        mutate(ISSUE_DETAILS(issueDetails.id));
      });
  };

  const removeIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId || !issueDetails) return;

    issuesService
      .removeIssueFromCycle(workspaceSlug as string, projectId as string, cycleId, bridgeId)
      .then((res) => {
        mutate(ISSUE_DETAILS(issueDetails.id));

        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const issueCycle = issueDetails?.issue_cycle;

  return (
    <CustomSelect
      customButton={
        <div className="inline-block w-full">
          <Tooltip
            position="left"
            tooltipContent={`${issueCycle ? issueCycle.cycle_detail.name : "No cycle"}`}
          >
            <button
              type="button"
              className={`flex-grow truncate bg-custom-background-80 text-xs rounded px-2.5 py-0.5 w-full flex ${
                disabled ? "cursor-not-allowed" : ""
              }`}
            >
              <span
                className={`truncate ${
                  issueCycle ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                {issueCycle ? issueCycle.cycle_detail.name : "No cycle"}
              </span>
            </button>
          </Tooltip>
        </div>
      }
      value={issueCycle ? issueCycle.cycle_detail.id : null}
      onChange={(value: any) => {
        !value
          ? removeIssueFromCycle(issueCycle?.id ?? "", issueCycle?.cycle ?? "")
          : handleCycleChange(incompleteCycles?.find((c) => c.id === value) as ICycle);
      }}
      width="w-full"
      position="right"
      maxHeight="rg"
      disabled={disabled}
    >
      {incompleteCycles ? (
        incompleteCycles.length > 0 ? (
          <>
            {incompleteCycles.map((option) => (
              <CustomSelect.Option key={option.id} value={option.id}>
                <Tooltip position="left-bottom" tooltipContent={option.name}>
                  <span className="w-full truncate">{truncateText(option.name, 25)}</span>
                </Tooltip>
              </CustomSelect.Option>
            ))}
            <CustomSelect.Option value={null}>None</CustomSelect.Option>
          </>
        ) : (
          <div className="text-center">No cycles found</div>
        )
      ) : (
        <Spinner />
      )}
    </CustomSelect>
  );
};
