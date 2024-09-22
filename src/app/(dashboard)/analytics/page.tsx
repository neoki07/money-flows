"use client";

import "gridstack/dist/gridstack.css";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/h1";
import { useCreateChartLayout } from "@/features/chart-layout/api/use-create-chart-layout";
import { useEditChartLayout } from "@/features/chart-layout/api/use-edit-chart-layout";
import { useGetChartLayouts } from "@/features/chart-layout/api/use-get-chart-layouts";

import { ChartEditor } from "./chart-editor";
import { ChartLayout } from "./chart-layout";
import { LayoutItem } from "./types";

const defaultLayout: LayoutItem[] = [
  {
    id: "item-1",
    x: 0,
    y: 0,
    w: 12,
    h: 4,
    component: {
      name: "MonthlyIncomeExpenseRemainingChart",
      props: {
        title: "収支の推移（年間）",
      },
    },
  },
  {
    id: "item-2",
    x: 0,
    y: 4,
    w: 6,
    h: 4,
    component: {
      name: "MonthlyLineChart",
      props: {
        title: "収入の推移（年間）",
        type: "income",
      },
    },
  },
  {
    id: "item-3",
    x: 6,
    y: 4,
    w: 6,
    h: 4,
    component: {
      name: "MonthlyLineChart",
      props: {
        title: "支出の推移（年間）",
        type: "expense",
      },
    },
  },
];

interface PageInnerProps {
  layoutId?: string;
  layoutState?: LayoutItem[];
}

function PageInner({ layoutId, layoutState }: PageInnerProps) {
  const [currentLayoutState, setCurrentLayoutState] = useState(
    layoutState ?? defaultLayout,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLayoutItemId, setSelectedLayoutItemId] = useState<string>();
  const selectedLayoutItem = selectedLayoutItemId
    ? currentLayoutState.find((item) => item.id === selectedLayoutItemId)
    : undefined;

  const createMutation = useCreateChartLayout();
  const updateMutation = useEditChartLayout(layoutId);

  const edit = () => {
    setIsEditing(true);
  };

  const save = () => {
    if (layoutState) {
      updateMutation.mutate({
        state: currentLayoutState,
      });
    } else {
      createMutation.mutate({
        state: currentLayoutState,
      });
    }

    setIsEditing(false);
    setSelectedLayoutItemId(undefined);
  };

  const cancel = () => {
    setCurrentLayoutState(layoutState ?? defaultLayout);
    setIsEditing(false);
    setSelectedLayoutItemId(undefined);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <H1>分析</H1>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={cancel}
                  className="w-full sm:w-auto"
                >
                  キャンセル
                </Button>
                <Button onClick={save} className="w-full sm:w-auto">
                  編集を完了
                </Button>
              </>
            ) : (
              <Button onClick={edit} className="w-full sm:w-auto">
                レイアウトを編集
              </Button>
            )}
          </div>
        </div>
        <div>
          <ChartLayout
            layoutState={currentLayoutState}
            setLayoutState={setCurrentLayoutState}
            editable={isEditing}
            selectedLayoutItemId={selectedLayoutItemId}
            setSelectedLayoutItemId={setSelectedLayoutItemId}
          />
        </div>
      </div>
      {selectedLayoutItem && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ChartEditor
            item={selectedLayoutItem}
            onChange={(item) => {
              setCurrentLayoutState((prev) =>
                prev.map((prevItem) =>
                  prevItem.id === item.id ? item : prevItem,
                ),
              );
            }}
          />
        </div>
      )}
    </>
  );
}

export default function Page() {
  const { data, isPending, isError } = useGetChartLayouts();

  if (isPending) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Error</p>;
  }

  return <PageInner layoutId={data?.[0]?.id} layoutState={data?.[0]?.state} />;
}
