import { GridStack } from "gridstack";
import groupBy from "lodash/groupBy";
import { createRef, useEffect, useRef } from "react";

import { MonthlyIncomeExpenseRemainingChart } from "./monthly-income-expense-remaining-chart";
import { MonthlyLineChart } from "./monthly-line-chart";
import { LayoutComponent, LayoutItem as LayoutStateItem } from "./types";

function ChartComponent({ component }: { component: LayoutComponent }) {
  switch (component.name) {
    case "MonthlyIncomeExpenseRemainingChart":
      return <MonthlyIncomeExpenseRemainingChart {...component.props} />;
    case "MonthlyLineChart":
      return <MonthlyLineChart {...component.props} />;
    default:
      return null;
  }
}

interface ChartLayoutProps {
  layoutState: LayoutStateItem[];
  setLayoutState: (layoutState: LayoutStateItem[]) => void;
  editable?: boolean;
}

export function ChartLayout({
  layoutState,
  setLayoutState,
  editable,
}: ChartLayoutProps) {
  const refs = useRef<{ [key in string]: React.RefObject<HTMLDivElement> }>({});
  const gridRef = useRef<GridStack>();

  if (Object.keys(refs.current).length !== layoutState.length) {
    layoutState.forEach(({ id }) => {
      refs.current[id] = refs.current[id] || createRef<HTMLDivElement>();
    });
  }

  useEffect(() => {
    gridRef.current = gridRef.current ?? GridStack.init();
    const grid = gridRef.current;
    grid.batchUpdate();
    grid.removeAll(false);
    layoutState.forEach(({ id }) => {
      if (refs.current[id].current) {
        grid.makeWidget(refs.current[id].current);
      }
    });
    grid.batchUpdate(false);

    grid.on("change", (_, element) => {
      const elementMap = groupBy(element, "id");

      const newLayoutState = layoutState.map((item) => {
        const element = elementMap[item.id]?.[0];
        if (element) {
          return {
            ...item,
            x: element.x ?? item.x,
            y: element.y ?? item.y,
            w: element.w ?? item.w,
            h: element.h ?? item.h,
          };
        }
        return item;
      });

      setLayoutState(newLayoutState);
    });
  }, [layoutState, setLayoutState, editable]);

  return (
    <div className="grid-stack -m-2.5 [&_.grid-stack-placeholder>.placeholder-content]:rounded-lg">
      {layoutState.map((item) => {
        return (
          <div
            ref={refs.current[item.id]}
            key={item.id}
            className="grid-stack-item"
            gs-id={item.id}
            gs-x={item.x}
            gs-y={item.y}
            gs-w={item.w}
            gs-h={item.h}
            gs-no-resize={editable ? undefined : "true"}
            gs-no-move={editable ? undefined : "true"}
            gs-locked={editable ? undefined : "true"}
          >
            <div className="grid-stack-item-content rounded-lg">
              <ChartComponent component={item.component} />
            </div>
          </div>
        );
      })}
    </div>
  );
}