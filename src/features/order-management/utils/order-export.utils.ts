import * as XLSX from "xlsx";
import type { AdminOrderListItem } from "../types/order.types";
import { formatOrderRowForExport } from "./order-row-export";

const BOM = "\uFEFF";

export function downloadOrdersCsv(rows: AdminOrderListItem[], filename = "orders_export.csv") {
  const headers = [
    "Order ID",
    "Date & Time",
    "Farmer Name",
    "Farmer Village",
    "Farmer Mobile",
    "Fodderman",
    "Partner",
    "Total Amount",
    "Payment Mode",
    "Payment Status",
    "Order Status",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) => {
      const f = formatOrderRowForExport(r);
      return [
        f.orderId,
        f.dateTime,
        f.farmerName,
        f.farmerVillage,
        f.farmerMobile,
        f.fodderman,
        f.partner,
        f.totalAmount,
        f.paymentMode,
        f.paymentStatus,
        f.orderStatus,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",");
    }),
  ];

  const blob = new Blob([BOM + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  saveBlobAsFile(blob, filename);
}

export function downloadOrdersExcel(rows: AdminOrderListItem[], filename = "orders_export.xlsx") {
  const sheetData = rows.map((r) => {
    const f = formatOrderRowForExport(r);
    return {
      "Order ID": f.orderId,
      "Date & Time": f.dateTime,
      "Farmer Name": f.farmerName,
      "Farmer Village": f.farmerVillage,
      "Farmer Mobile": f.farmerMobile,
      Fodderman: f.fodderman,
      Partner: f.partner,
      "Total Amount": f.totalAmount,
      "Payment Mode": f.paymentMode,
      "Payment Status": f.paymentStatus,
      "Order Status": f.orderStatus,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData.length ? sheetData : [{}]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  XLSX.writeFile(workbook, filename);
}

export function saveBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
