import * as React from "react";
import {
  CSSProperties,
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataGrid } from "@/components/ui/data-grid";
import {
  Cell,
  Column,
  flexRender,
  Header,
  HeaderGroup,
  Row,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  useVirtualizer,
  VirtualItem,
  Virtualizer,
} from "@tanstack/react-virtual";
import { DataGridTableHeadRowCellResize } from "@/components/ui/data-grid-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { SlidersHorizontal } from "lucide-react";

const headerCellSpacingVariants = cva("", {
  variants: {
    size: {
      dense: "px-2.5 h-8",
      default: "px-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const bodyCellSpacingVariants = cva("", {
  variants: {
    size: {
      dense: "px-2.5 py-1.5",
      default: "px-3 py-2",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface VirtualTableProps {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
}

const VirtualDataGridContext = React.createContext<VirtualTableProps | null>(
  null
);

function getPinningStyles<TData>(column: Column<TData>): CSSProperties {
  const isPinned = column.getIsPinned();

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}

function VirtualDataGridTableBase({ children }: { children: ReactNode }) {
  const { props } = useDataGrid();

  return (
    <table
      data-slot="virtual-data-grid-table"
      className={cn(
        "w-full align-middle caption-bottom text-left rtl:text-right text-foreground font-normal text-sm",
        !props.tableLayout?.columnsDraggable &&
          "border-separate border-spacing-0",
        props.tableLayout?.width === "fixed" ? "table-fixed" : "table-auto",
        props.tableClassNames?.base
      )}
      style={{
        display: "grid",
        width: "100%",
      }}
    >
      {children}
    </table>
  );
}

function VirtualDataGridTableHead({ children }: { children: ReactNode }) {
  const { props } = useDataGrid();

  return (
    <thead
      className={cn(
        props.tableClassNames?.header,
        props.tableLayout?.headerSticky && props.tableClassNames?.headerSticky
      )}
      // style={{
      //   display: "grid",
      //   position: props.tableLayout?.headerSticky ? "sticky" : "relative",
      //   top: 0,
      //   zIndex: 1,
      // }}
    >
      {children}
    </thead>
  );
}

function VirtualDataGridTableHeadRow<TData>({
  children,
  headerGroup,
}: {
  children: ReactNode;
  headerGroup: HeaderGroup<TData>;
}) {
  const { props } = useDataGrid();

  return (
    <tr
      key={headerGroup.id}
      className={cn(
        "bg-muted/40",
        props.tableLayout?.headerBorder && "[&>th]:border-b",
        props.tableLayout?.cellBorder && "[&_>:last-child]:border-e-0",
        props.tableLayout?.stripped && "bg-transparent",
        props.tableLayout?.headerBackground === false && "bg-transparent",
        props.tableClassNames?.headerRow
      )}
      style={{
        display: "flex",
        width: "100%",
      }}
    >
      {children}
    </tr>
  );
}

function VirtualDataGridTableHeadRowCell<TData>({
  children,
  header,
  dndRef,
  dndStyle,
}: {
  children: ReactNode;
  header: Header<TData, unknown>;
  dndRef?: React.Ref<HTMLTableCellElement>;
  dndStyle?: CSSProperties;
}) {
  const { props } = useDataGrid();

  const { column } = header;
  const isPinned = column.getIsPinned();
  const isLastLeftPinned =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinned =
    isPinned === "right" && column.getIsFirstColumn("right");
  const headerCellSpacing = headerCellSpacingVariants({
    size: props.tableLayout?.dense ? "dense" : "default",
  });

  return (
    <th
      key={header.id}
      ref={dndRef}
      style={{
        ...(props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          getPinningStyles(column)),
        ...(dndStyle ? dndStyle : null),

        width: header.getSize(),
        display: "flex",
        alignItems: "center",
      }}
      data-pinned={isPinned || undefined}
      data-last-col={
        isLastLeftPinned ? "left" : isFirstRightPinned ? "right" : undefined
      }
      className={cn(
        "relative h-10 text-left rtl:text-right align-middle font-normal text-accent-foreground [&:has([role=checkbox])]:pe-0 text-2sm",
        headerCellSpacing,
        props.tableLayout?.cellBorder && "border-e",
        // props.tableLayout?.columnsResizable &&
        //   column.getCanResize() &&
        //   "truncate",
        props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          "[&:not([data-pinned]):has(+[data-pinned])_div.cursor-col-resize:last-child]:opacity-0 [&[data-last-col=left]_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=left][data-last-col=left]]:border-e! [&[data-pinned=right]:last-child_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=right][data-last-col=right]]:border-s! [&[data-pinned][data-last-col]]:border-border data-pinned:bg-muted/90 data-pinned:backdrop-blur-xs",
        header.column.columnDef.meta?.headerClassName,
        column.getIndex() === 0 ||
          column.getIndex() === header.headerGroup.headers.length - 1
          ? props.tableClassNames?.edgeCell
          : ""
      )}
    >
      {children}
    </th>
  );
}

function VirtualDataGridTableHeadRowCellResize<TData>({
  header,
}: {
  header: Header<TData, unknown>;
}) {
  const { column } = header;

  return (
    <div
      {...{
        onDoubleClick: () => column.resetSize(),
        onMouseDown: header.getResizeHandler(),
        onTouchStart: header.getResizeHandler(),
        className:
          "absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -end-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:-translate-x-px",
      }}
    />
  );
}

function VirtualDataGridTableRowSpacer() {
  return <tbody aria-hidden="true" className="h-2"></tbody>;
}

function VirtualDataGridTableBody({ children }: { children: ReactNode }) {
  const { props } = useDataGrid();
  const virtualContext = React.useContext(VirtualDataGridContext);

  return (
    <tbody
      className={cn(
        "[&_tr:last-child]:border-0",
        props.tableLayout?.rowRounded &&
          "[&_td:first-child]:rounded-s-lg [&_td:last-child]:rounded-e-lg",
        props.tableClassNames?.body
      )}
      style={{
        display: "grid",
        height: virtualContext?.rowVirtualizer.getTotalSize()
          ? `${virtualContext?.rowVirtualizer.getTotalSize()}px`
          : "4rem",
        position: "relative",
      }}
    >
      {children}
    </tbody>
  );
}

function VirtualDataGridTableBodyRowSkeleton({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  const { table, props } = useDataGrid();
  const virtualContext = React.useContext(VirtualDataGridContext);

  // Calculate the skeleton row position based on estimated row height
  const estimatedRowHeight =
    virtualContext?.rowVirtualizer.options.estimateSize?.(index) || 50;
  const translateY = index * estimatedRowHeight;

  return (
    <tr
      className={cn(
        "hover:bg-muted/40 data-[state=selected]:bg-muted/50",
        props.onRowClick && "cursor-pointer",
        !props.tableLayout?.stripped &&
          props.tableLayout?.rowBorder &&
          "border-b border-border [&:not(:last-child)>td]:border-b",
        props.tableLayout?.cellBorder && "[&_>:last-child]:border-e-0",
        props.tableLayout?.stripped &&
          "odd:bg-muted/90 hover:bg-transparent odd:hover:bg-muted",
        table.options.enableRowSelection && "[&_>:first-child]:relative",
        props.tableClassNames?.bodyRow
      )}
      style={{
        display: "flex",
        position: "absolute",
        transform: `translateY(${translateY}px)`,
        width: "100%",
      }}
    >
      {children}
    </tr>
  );
}

function VirtualDataGridTableBodyRowSkeletonCell<TData>({
  children,
  column,
}: {
  children: ReactNode;
  column: Column<TData>;
}) {
  const { props, table } = useDataGrid();
  const bodyCellSpacing = bodyCellSpacingVariants({
    size: props.tableLayout?.dense ? "dense" : "default",
  });

  return (
    <td
      className={cn(
        "align-middle",
        bodyCellSpacing,
        props.tableLayout?.cellBorder && "border-e",
        // props.tableLayout?.columnsResizable &&
        //   column.getCanResize() &&
        //   "truncate",
        column.columnDef.meta?.cellClassName,
        props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          '[&[data-pinned=left][data-last-col=left]]:border-e! [&[data-pinned=right][data-last-col=right]]:border-s! [&[data-pinned][data-last-col]]:border-border data-pinned:bg-background data-pinned:backdrop-blur-xs"',
        column.getIndex() === 0 ||
          column.getIndex() === table.getVisibleFlatColumns().length - 1
          ? props.tableClassNames?.edgeCell
          : ""
      )}
      style={{
        display: "flex",
        width: column.getSize(),
      }}
    >
      {children}
    </td>
  );
}

const VirtualDataGridTableBodyRow = React.memo(
  function VirtualDataGridTableBodyRow<TData>({
    row,
    virtualRow,
    dndRef,
    dndStyle,
    extraData,
  }: {
    row: Row<TData>;
    virtualRow: VirtualItem;
    dndRef?: React.Ref<HTMLTableRowElement>;
    dndStyle?: CSSProperties;
    extraData?: unknown;
  }) {
    const { props, table } = useDataGrid();
    const virtualContext = React.useContext(VirtualDataGridContext);
    const rowRef = React.useRef<HTMLTableRowElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTableRowElement | null) => {
        rowRef.current = node;
        if (typeof dndRef === "function") dndRef(node);
        else if (dndRef)
          (
            dndRef as React.MutableRefObject<HTMLTableRowElement | null>
          ).current = node;
      },
      [dndRef]
    );

    React.useLayoutEffect(() => {
      if (rowRef.current && virtualContext?.rowVirtualizer) {
        virtualContext.rowVirtualizer.measureElement(rowRef.current);
      }
    }, [virtualRow.index, virtualContext?.rowVirtualizer, extraData]);

    return (
      <tr
        ref={setRefs}
        data-state={
          table.options.enableRowSelection && row.getIsSelected()
            ? "selected"
            : undefined
        }
        onClick={() => props.onRowClick && props.onRowClick(row.original)}
        className={cn(
          "hover:bg-muted/40 data-[state=selected]:bg-muted/50",
          props.onRowClick && "cursor-pointer",
          !props.tableLayout?.stripped &&
            props.tableLayout?.rowBorder &&
            "border-b border-border [&:not(:last-child)>td]:border-b",
          props.tableLayout?.cellBorder && "[&_>:last-child]:border-e-0",
          props.tableLayout?.stripped &&
            "odd:bg-muted/90 hover:bg-transparent odd:hover:bg-muted",
          table.options.enableRowSelection && "[&_>:first-child]:relative",
          props.tableClassNames?.bodyRow
        )}
        data-index={virtualRow.index}
        key={row.id}
        style={{
          ...(dndStyle ? dndStyle : null),
          display: "flex",
          position: "absolute",
          transform: `translateY(${virtualRow.start}px)`,
          width: "100%",
        }}
      >
        {row.getVisibleCells().map((cell: Cell<TData, unknown>, colIndex) => {
          return (
            <VirtualDataGridTableBodyRowCell
              cell={cell}
              key={colIndex}
              extraData={extraData}
            />
          );
        })}
      </tr>
    );
  },
  (prev, next) => {
    // Check if column sizes have changed
    const prevCells = prev.row.getVisibleCells();
    const nextCells = next.row.getVisibleCells();

    const columnSizesMatch =
      prevCells.length === nextCells.length &&
      prevCells.every(
        (cell, index) =>
          cell.column.getSize() === nextCells[index]?.column.getSize()
      );

    return (
      prev.row.id === next.row.id &&
      prev.row.original === next.row.original && // Check if underlying data changed
      prev.row.getIsSelected() === next.row.getIsSelected() &&
      prev.virtualRow.index === next.virtualRow.index &&
      prev.virtualRow.start === next.virtualRow.start &&
      prev.virtualRow.size === next.virtualRow.size &&
      prev.dndStyle === next.dndStyle &&
      prev.extraData === next.extraData &&
      columnSizesMatch
    );
  }
) as <TData>(props: {
  row: Row<TData>;
  virtualRow: VirtualItem;
  dndRef?: React.Ref<HTMLTableRowElement>;
  dndStyle?: CSSProperties;
  extraData?: unknown;
}) => React.ReactElement;

function VirtualDataGridTableBodyRowExpandded<TData>({
  row,
}: {
  row: Row<TData>;
}) {
  const { props, table } = useDataGrid();

  return (
    <tr
      className={cn(
        props.tableLayout?.rowBorder && "[&:not(:last-child)>td]:border-b"
      )}
    >
      <td colSpan={row.getVisibleCells().length}>
        {table
          .getAllColumns()
          .find((column) => column.columnDef.meta?.expandedContent)
          ?.columnDef.meta?.expandedContent?.(row.original)}
      </td>
    </tr>
  );
}

const VirtualDataGridTableBodyRowCell = React.memo(
  function VirtualDataGridTableBodyRowCell<TData>({
    cell,
    dndRef,
    dndStyle,
    extraData: _extraData,
  }: {
    cell: Cell<TData, unknown>;
    dndRef?: React.Ref<HTMLTableCellElement>;
    dndStyle?: CSSProperties;
    extraData?: unknown;
  }) {
    const { props } = useDataGrid();

    const { column, row } = cell;
    const isPinned = column.getIsPinned();
    const isLastLeftPinned =
      isPinned === "left" && column.getIsLastColumn("left");
    const isFirstRightPinned =
      isPinned === "right" && column.getIsFirstColumn("right");
    const bodyCellSpacing = bodyCellSpacingVariants({
      size: props.tableLayout?.dense ? "dense" : "default",
    });

    return (
      <td
        key={cell.id}
        ref={dndRef}
        {...(props.tableLayout?.columnsDraggable && !isPinned ? { cell } : {})}
        style={{
          ...(props.tableLayout?.columnsPinnable &&
            column.getCanPin() &&
            getPinningStyles(column)),
          ...(dndStyle ? dndStyle : null),
          display: "flex",
          width: cell.column.getSize(),
        }}
        data-pinned={isPinned || undefined}
        data-last-col={
          isLastLeftPinned ? "left" : isFirstRightPinned ? "right" : undefined
        }
        className={cn(
          "align-middle text-2sm",
          bodyCellSpacing,
          props.tableLayout?.cellBorder && "border-e",
          // props.tableLayout?.columnsResizable &&
          //   column.getCanResize() &&
          //   "truncate",
          cell.column.columnDef.meta?.cellClassName,
          props.tableLayout?.columnsPinnable &&
            column.getCanPin() &&
            '[&[data-pinned=left][data-last-col=left]]:border-e! [&[data-pinned=right][data-last-col=right]]:border-s! [&[data-pinned][data-last-col]]:border-border data-pinned:bg-background data-pinned:backdrop-blur-xs"',
          column.getIndex() === 0 ||
            column.getIndex() === row.getVisibleCells().length - 1
            ? props.tableClassNames?.edgeCell
            : ""
        )}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  },
  (prev, next) => {
    return (
      prev.cell.id === next.cell.id &&
      prev.cell.getValue() === next.cell.getValue() &&
      prev.cell.column.getSize() === next.cell.column.getSize() &&
      prev.dndStyle === next.dndStyle &&
      prev.extraData === next.extraData
    );
  }
) as <TData>(props: {
  cell: Cell<TData, unknown>;
  dndRef?: React.Ref<HTMLTableCellElement>;
  dndStyle?: CSSProperties;
  extraData?: unknown;
}) => React.ReactElement;

function VirtualDataGridTableEmpty() {
  const { table, props } = useDataGrid();
  const totalColumns = table.getVisibleLeafColumns().length;

  return (
    <tr
      style={{
        display: "flex",
        position: "absolute",
        transform: `translateY(0px)`,
        width: "100%",
      }}
    >
      <td
        colSpan={totalColumns}
        style={{
          display: "flex",
          width: "100%",
        }}
        className={cn(
          "text-center text-muted-foreground py-6 w-full justify-center",
          props.tableLayout?.cellBorder && "border-e",
          props.tableClassNames?.bodyRow
        )}
      >
        {props.emptyMessage || "No data available"}
      </td>
    </tr>
  );
}

function VirtualDataGridTableLoader() {
  const { props } = useDataGrid();

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="text-muted-foreground bg-card flex items-center gap-2 px-4 py-2 font-medium leading-none text-sm border shadow-xs rounded-md">
        <svg
          className="animate-spin -ml-1 h-5 w-5 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {props.loadingMessage || "Loading..."}
      </div>
    </div>
  );
}

function VirtualDataGridTableRowSelect<TData>({
  row,
  size,
}: {
  row: Row<TData>;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <>
      <div
        className={cn(
          "hidden absolute top-0 bottom-0 start-0 w-[2px] bg-primary",
          row.getIsSelected() && "block"
        )}
      />
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        size={size ?? "sm"}
        className="align-[inherit]"
      />
    </>
  );
}

function VirtualDataGridTableRowSelectAll({
  size,
}: {
  size?: "sm" | "md" | "lg";
}) {
  const { table, recordCount, isLoading } = useDataGrid();

  return (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      disabled={isLoading || recordCount === 0}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
      size={size}
      className="align-[inherit]"
    />
  );
}

function VirtualDataGridTable<TData>() {
  const { table, isLoading, props } = useDataGrid();
  const pagination = table.getState().pagination;
  const { rows } = table.getRowModel();

  // Setup row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => props?.virtualizeTable?.estimatedRowHeight || 53,
    getScrollElement: () =>
      props?.virtualizeTable?.scollableElementRef?.current || null,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => (element as HTMLElement)?.offsetHeight
        : undefined,
    overscan: props?.virtualizeTable?.overscan || 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Handle sorting changes and scroll to top
  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      if (props?.virtualizeTable?.onSortingChange) {
        props?.virtualizeTable?.onSortingChange(updater as SortingState);
      }
      if (rows.length > 0) {
        rowVirtualizer.scrollToIndex?.(0);
      }
    },
    [props?.virtualizeTable, rows.length, rowVirtualizer]
  );

  useEffect(() => {
    table.setOptions((prev) => ({
      ...prev,
      onSortingChange: handleSortingChange,
    }));
  }, [table, handleSortingChange]);

  const contextValue = useMemo(
    () => ({
      rowVirtualizer,
    }),
    [rowVirtualizer]
  );
  return (
    <VirtualDataGridContext.Provider value={contextValue}>
      <VirtualDataGridTableBase>
        {props.tableLayout?.columnsVisibility && (
          <div className="flex justify-start my-2 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="max-h-64 overflow-y-auto p-2 space-y-1 w-48"
              >
                {/* Optional: Toggle all */}
                <div className="flex items-center justify-between px-2 py-1 border-b mb-1">
                  <label className="text-sm font-medium">Show All</label>
                  <Checkbox
                    checked={table.getIsAllColumnsVisible()}
                    onCheckedChange={(checked) =>
                      table.toggleAllColumnsVisible(!!checked)
                    }
                  />
                </div>

                {table.getAllLeafColumns().map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                  >
                    <label className="text-2sm truncate">
                      {column.id
                        .replace(/_/g, " ") // replace underscores with spaces
                        .replace(/\b\w/g, (char) => char.toUpperCase())}{" "}
                      {/* capitalize each word */}
                    </label>

                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) =>
                        column.toggleVisibility(!!checked)
                      }
                    />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <VirtualDataGridTableHead>
          {table
            .getHeaderGroups()
            .map((headerGroup: HeaderGroup<TData>, index) => {
              return (
                <VirtualDataGridTableHeadRow
                  headerGroup={headerGroup}
                  key={index}
                >
                  {headerGroup.headers.map((header, headerIndex) => {
                    return (
                      <VirtualDataGridTableHeadRowCell
                        header={header}
                        key={headerIndex}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {props.tableLayout?.columnsResizable &&
                          header.column.getCanResize() && (
                            <DataGridTableHeadRowCellResize header={header} />
                          )}
                      </VirtualDataGridTableHeadRowCell>
                    );
                  })}
                </VirtualDataGridTableHeadRow>
              );
            })}
        </VirtualDataGridTableHead>

        {(props.tableLayout?.stripped || !props.tableLayout?.rowBorder) && (
          <VirtualDataGridTableRowSpacer />
        )}

        <VirtualDataGridTableBody>
          {props.loadingMode === "skeleton" &&
          isLoading &&
          pagination?.pageSize ? (
            Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
              <VirtualDataGridTableBodyRowSkeleton
                key={rowIndex}
                index={rowIndex}
              >
                {table.getVisibleFlatColumns().map((column, colIndex) => {
                  return (
                    <VirtualDataGridTableBodyRowSkeletonCell
                      column={column}
                      key={colIndex}
                    >
                      {column.columnDef.meta?.skeleton}
                    </VirtualDataGridTableBodyRowSkeletonCell>
                  );
                })}
              </VirtualDataGridTableBodyRowSkeleton>
            ))
          ) : virtualItems.length ? (
            virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <Fragment key={row.id}>
                  <VirtualDataGridTableBodyRow
                    row={row}
                    virtualRow={virtualRow}
                    extraData={props.virtualizeTable?.extraData}
                  />
                  {row.getIsExpanded() && (
                    <VirtualDataGridTableBodyRowExpandded row={row} />
                  )}
                </Fragment>
              );
            })
          ) : (
            <VirtualDataGridTableEmpty />
          )}
        </VirtualDataGridTableBody>
      </VirtualDataGridTableBase>
    </VirtualDataGridContext.Provider>
  );
}

export {
  VirtualDataGridTable,
  VirtualDataGridTableBase,
  VirtualDataGridTableBody,
  VirtualDataGridTableBodyRow,
  VirtualDataGridTableBodyRowCell,
  VirtualDataGridTableBodyRowExpandded,
  VirtualDataGridTableBodyRowSkeleton,
  VirtualDataGridTableBodyRowSkeletonCell,
  VirtualDataGridTableEmpty,
  VirtualDataGridTableHead,
  VirtualDataGridTableHeadRow,
  VirtualDataGridTableHeadRowCell,
  VirtualDataGridTableHeadRowCellResize,
  VirtualDataGridTableLoader,
  VirtualDataGridTableRowSelect,
  VirtualDataGridTableRowSelectAll,
  VirtualDataGridTableRowSpacer,
};
