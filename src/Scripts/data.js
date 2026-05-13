/* Seed data for the Odoo 18 module handbook.
   Schema v2:
   - SEED_DATA.modules[] — multiple modules
   - Each module has mainFlows[] (named flows)
   - Each feature has:
       flows[]         — multiple named processing flows
       detailBlocks[]  — multiple titled markdown blocks
       integrations[]  — multiple integration items (target module, direction, body)
       notes
*/

export const uid = (p = "x") =>
  p + "_" + Math.random().toString(36).slice(2, 7);

/* ────────────────────────────────────────────────────────────
   SALES — fully fleshed out
   ──────────────────────────────────────────────────────────── */
export const SALES = {
  id: "mod_sale",
  name: "Sales",
  tech: "sale",
  color: "#5BAA50",
  status: "studying",
  updatedAt: "2026-05-13",
  overview: {
    version: "18.0",
    category: "Bán hàng",
    depends: "base, mail, account, stock, product, portal",
    menu: "Sales ▸ Orders ▸ Quotations",
    purpose:
      "Quản lý toàn bộ quy trình bán hàng từ báo giá → đơn hàng → giao hàng → hóa đơn. Tích hợp với Inventory để xuất kho và Accounting để ghi nhận doanh thu. Hỗ trợ giá theo bảng giá, chiết khấu, thuế đa cấp, và quy trình duyệt nhiều cấp."
  },

  // ... toàn bộ phần mainFlows / features giữ nguyên ...
};

/* ────────────────────────────────────────────────────────────
   Skeleton modules
   ──────────────────────────────────────────────────────────── */

export function emptyModule(opts) {
  return {
    id: opts.id,
    name: opts.name,
    tech: opts.tech,
    color: opts.color,
    status: opts.status || "pending",
    updatedAt: opts.updatedAt || "—",

    overview: {
      version: "18.0",
      category: opts.category || "—",
      depends: opts.depends || "base, mail",
      menu: opts.menu || "",
      purpose: opts.purpose || ""
    },

    mainFlows: [],
    features: opts.features || []
  };
}

export const PURCHASE = emptyModule({
  id: "mod_purchase",
  name: "Purchase",
  tech: "purchase",
  color: "#BA7517",
  status: "pending",
  updatedAt: "2026-05-08",

  category: "Mua hàng",
  depends: "base, mail, account, stock, product",
  menu: "Purchase ▸ Orders ▸ Requests for Quotation",
  purpose:
    "Quản lý quy trình mua hàng: yêu cầu báo giá → đơn mua → nhập kho → hóa đơn nhà cung cấp. Tương đương Sales nhưng đối nghịch dòng tiền.",

  features: [
    {
      id: "f1",
      name: "Yêu cầu báo giá (RFQ)",
      desc: "Gửi RFQ cho nhiều NCC, so sánh báo giá",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    },
    {
      id: "f2",
      name: "Xác nhận PO & nhập kho",
      desc: "Tạo phiếu nhập sau khi NCC xác nhận",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    }
  ]
});

export const STOCK = emptyModule({
  id: "mod_stock",
  name: "Inventory",
  tech: "stock",
  color: "#378ADD",
  status: "done",
  updatedAt: "2026-04-22",

  category: "Kho",
  depends: "base, product, mail",
  menu: "Inventory ▸ Operations ▸ Transfers",
  purpose:
    "Quản lý kho đa địa điểm, multi-step routes (pick/pack/ship), lot & serial, kiểm kê tồn.",

  features: [
    {
      id: "f1",
      name: "Quản lý phiếu xuất/nhập",
      desc: "Tạo, xác nhận, hoàn tất các stock.picking",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    },
    {
      id: "f2",
      name: "Lot & Serial tracking",
      desc: "Theo dõi từng lô / số sê-ri sản phẩm",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    },
    {
      id: "f3",
      name: "Multi-warehouse & Routes",
      desc: "Định tuyến hàng giữa các kho",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    }
  ]
});

export const ACCOUNT = emptyModule({
  id: "mod_account",
  name: "Accounting",
  tech: "account",
  color: "#7F77DD",
  status: "studying",
  updatedAt: "2026-05-11",

  category: "Kế toán",
  depends: "base, mail, product",
  menu: "Accounting ▸ Customers ▸ Invoices",
  purpose:
    "Sổ kế toán đôi đầy đủ: invoice, payment, reconciliation, báo cáo BCTC, multi-currency, multi-company.",

  features: [
    {
      id: "f1",
      name: "Hóa đơn bán & mua",
      desc: "out_invoice / in_invoice",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    },
    {
      id: "f2",
      name: "Thanh toán & đối chiếu",
      desc: "account.payment + bank reconciliation",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    }
  ]
});

export const CRM = emptyModule({
  id: "mod_crm",
  name: "CRM",
  tech: "crm",
  color: "#D4537E",
  status: "pending",
  updatedAt: "—",

  category: "Quan hệ KH",
  depends: "base, mail, sales_team",
  menu: "CRM ▸ Sales ▸ My Pipeline",
  purpose:
    "Quản lý lead → opportunity → won. Kanban pipeline, scoring, activity reminder.",

  features: []
});

export const HR = emptyModule({
  id: "mod_hr",
  name: "HR",
  tech: "hr",
  color: "#5BAA50",
  status: "pending",
  updatedAt: "—",

  category: "Nhân sự",
  depends: "base, mail, resource",
  menu: "Employees ▸ Employees",
  purpose:
    "Hồ sơ nhân viên, phòng ban, chức danh. Cơ sở cho các module Attendance / Payroll / Recruitment.",

  features: []
});

/* Export object chính */
export const SEED_DATA = {
  modules: [SALES, PURCHASE, STOCK, ACCOUNT, CRM, HR]
};

/* Optional default export */
export default SEED_DATA;