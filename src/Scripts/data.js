/* Seed data — schema v3.
   Structure: data.notebooks[] → notebook.modules[] → module.features[]
*/

export const uid = (p = "x") =>
  p + "_" + Math.random().toString(36).slice(2, 7);

/* ── Individual modules ── */
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
  mainFlows: [],
  features: [
    {
      id: "f_sale_1",
      name: "Tạo & Xác nhận báo giá",
      desc: "Tạo bản nháp, gửi khách, xác nhận đơn hàng",
      models: {
        cards: [
          {
            id: "mc_so", name: "sale.order", color: "#5BAA50", x: 40, y: 40, width: 310,
            fields: [
              { name: "name",         type: "Char",      desc: "Mã đơn (SO00…)", req: true },
              { name: "partner_id",   type: "Many2one",  desc: "Khách hàng",     req: true, relTo: "mc_partner" },
              { name: "pricelist_id", type: "Many2one",  desc: "Bảng giá" },
              { name: "state",        type: "Selection", desc: "draft/sent/sale" },
              { name: "date_order",   type: "Datetime",  desc: "Ngày báo giá",   req: true },
              { name: "order_line",   type: "One2many",  desc: "Chi tiết đơn",   relTo: "mc_sol" },
              { name: "amount_total", type: "Monetary",  desc: "Tổng tiền" }
            ]
          },
          {
            id: "mc_sol", name: "sale.order.line", color: "#378ADD", x: 420, y: 40, width: 310,
            fields: [
              { name: "order_id",      type: "Many2one",  desc: "Đơn hàng",       req: true, relTo: "mc_so" },
              { name: "product_id",    type: "Many2one",  desc: "Sản phẩm",       req: true },
              { name: "product_uom_c", type: "Float",     desc: "Số lượng",       req: true },
              { name: "price_unit",    type: "Float",     desc: "Đơn giá" },
              { name: "discount",      type: "Float",     desc: "% chiết khấu" },
              { name: "tax_id",        type: "Many2many", desc: "Thuế áp dụng" },
              { name: "price_subtotal",type: "Monetary",  desc: "Thành tiền" }
            ]
          },
          {
            id: "mc_partner", name: "res.partner", color: "#D85A30", x: 40, y: 380, width: 310,
            fields: [
              { name: "name",          type: "Char",     desc: "Tên KH",   req: true },
              { name: "vat",           type: "Char",     desc: "MST" },
              { name: "property_paym", type: "Many2one", desc: "Điều khoản thanh toán" }
            ]
          }
        ]
      },
      flows: [],
      detailBlocks: [
        {
          id: "db_s1", icon: "ti-target", title: "Mục đích & Phạm vi",
          content: "<p>Cho phép sales tạo nhanh báo giá cho khách hàng từ catalog sản phẩm, gửi qua email, và theo dõi trạng thái duyệt.</p><p>Áp dụng cho cả <b>B2B</b> (cần báo giá có ký) và <b>B2C</b> (giỏ hàng online qua portal).</p>"
        },
        {
          id: "db_s2", icon: "ti-list-numbers", title: "Thao tác chính",
          content: "<ol><li>Tạo <code>sale.order</code> (draft) — auto fill địa chỉ giao/xuất hóa đơn từ <code>res.partner</code></li><li>Chọn sản phẩm, số lượng × giá × chiết khấu × thuế</li><li>Bấm <b>Send by Email</b> để gửi PDF báo giá (template <code>sale.email_template_edi_sale</code>)</li><li>Khi khách OK → bấm <b>Confirm</b> → state đổi sang <code>sale</code>, sinh <code>stock.picking</code> + <code>account.move</code></li></ol>"
        },
        {
          id: "db_s3", icon: "ti-gavel", title: "Quy tắc nghiệp vụ",
          content: "<ul><li>Báo giá có thể có nhiều version (revision) — Odoo tự tăng số <mark style='background:#FEF08A'>(SO0001 → SO0001-1)</mark></li><li>Mỗi dòng order_line auto-tính <code>price_subtotal = qty × (unit − discount%) × (1 + tax%)</code></li><li>Pricelist quyết định <code>price_unit</code> mặc định khi chọn sản phẩm</li><li>Báo giá có <code>validity_date</code> — sau ngày này khách không click confirm được từ portal</li></ul>"
        }
      ],
      integrations: [
        { id:"int_s1", module:"product", icon:"ti-package", color:"#5BAA50", direction:"in",
          content:"<p>Lấy danh sách sản phẩm + giá vốn + đơn vị tính từ <code>product.product</code>.</p><p>Khi chọn sản phẩm vào order_line, các trường auto-fill:</p><ul><li><code>name</code> ← product.display_name</li><li><code>price_unit</code> ← product.list_price (hoặc pricelist nếu có)</li><li><code>tax_id</code> ← product.taxes_id</li><li><code>product_uom</code> ← product.uom_id</li></ul>" },
        { id:"int_s2", module:"res.partner", icon:"ti-user", color:"#7C3AED", direction:"in",
          content:"<p>Thông tin khách hàng: tên, MST, địa chỉ. Khi chọn partner_id:</p><ul><li>Auto chọn <code>pricelist_id</code> từ <code>partner.property_product_pricelist</code></li><li>Auto chọn <code>payment_term_id</code> từ <code>partner.property_payment_term_id</code></li><li>Auto fill địa chỉ giao hàng / xuất hóa đơn</li></ul>" },
        { id:"int_s3", module:"stock", icon:"ti-truck", color:"#D97706", direction:"out",
          content:"<p>Khi confirm SO, hệ thống tạo <code>stock.picking</code> (loại Outgoing) theo warehouse của SO.</p><p>Mỗi <code>order_line</code> có sản phẩm storable sẽ sinh 1 <code>stock.move</code>.</p>" },
        { id:"int_s4", module:"account", icon:"ti-calculator", color:"#2563EB", direction:"out",
          content:"<p>Khi invoice SO → tạo <code>account.move</code> (type: out_invoice).</p><p>Mapping: <code>sale.order.line</code> → <code>account.move.line</code> theo <code>invoice_policy</code> (ordered / delivered).</p>" },
        { id:"int_s5", module:"portal", icon:"ti-world", color:"#0891B2", direction:"bidi",
          content:"<p>Khách hàng có thể xem báo giá, xác nhận, và tải PDF qua portal link.</p><p>Portal user có thể sign online → cập nhật <code>signature</code> trên SO.</p>" }
      ],
      notes: "",
      cases: [
        {
          id: "cs_s1",
          title: "Báo giá không tự fill pricelist",
          status: "resolved",
          chatLink: "",
          description: "Khi tạo SO cho khách hàng đã có pricelist cố định trong cấu hình, hệ thống không tự điền pricelist_id mà để trống — sales phải chọn tay mỗi lần.",
          images: [],
          cause: "Partner chưa được set property_product_pricelist. Field này là company-dependent property, không phải trường thông thường.",
          resolution: "Vào menu Sales ▸ Configuration ▸ Settings, bật 'Pricelists'. Sau đó mở form partner → tab Sales & Purchase → set 'Pricelist' mặc định."
        }
      ]
    },
    { id: "f_sale_2", name: "Quản lý đơn hàng đã xác nhận", desc: "Theo dõi tiến độ giao hàng", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" },
    { id: "f_sale_3", name: "Giao hàng & Vận chuyển",       desc: "Tích hợp với Inventory để xuất kho", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" },
    { id: "f_sale_4", name: "Lập hóa đơn từ đơn hàng",     desc: "Sinh hóa đơn full / partial",        models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" }
  ]
};

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
  id: "mod_purchase", name: "Purchase", tech: "purchase",
  color: "#BA7517", status: "pending", updatedAt: "2026-05-08",
  category: "Mua hàng", depends: "base, mail, account, stock, product",
  menu: "Purchase ▸ Orders ▸ Requests for Quotation",
  purpose: "Quản lý quy trình mua hàng: yêu cầu báo giá → đơn mua → nhập kho → hóa đơn nhà cung cấp.",
  features: [
    { id: "f1", name: "Yêu cầu báo giá (RFQ)", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" },
    { id: "f2", name: "Xác nhận PO & nhập kho", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" }
  ]
});

export const STOCK = emptyModule({
  id: "mod_stock", name: "Inventory", tech: "stock",
  color: "#378ADD", status: "done", updatedAt: "2026-04-22",
  category: "Kho", depends: "base, product, mail",
  menu: "Inventory ▸ Operations ▸ Transfers",
  purpose: "Quản lý kho đa địa điểm, multi-step routes (pick/pack/ship), lot & serial, kiểm kê tồn.",
  features: [
    { id: "f1", name: "Quản lý phiếu xuất/nhập", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" },
    { id: "f2", name: "Lot & Serial tracking", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" },
    { id: "f3", name: "Multi-warehouse & Routes", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" }
  ]
});

export const ACCOUNT = emptyModule({
  id: "mod_account", name: "Accounting", tech: "account",
  color: "#7F77DD", status: "studying", updatedAt: "2026-05-11",
  category: "Kế toán", depends: "base, mail, product",
  menu: "Accounting ▸ Customers ▸ Invoices",
  purpose: "Sổ kế toán đôi đầy đủ: invoice, payment, reconciliation, báo cáo BCTC, multi-currency, multi-company.",
  features: [
    { id: "f1", name: "Hóa đơn bán & mua", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" },
    { id: "f2", name: "Thanh toán & đối chiếu", desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" }
  ]
});

export const CRM = emptyModule({
  id: "mod_crm", name: "CRM", tech: "crm",
  color: "#D4537E", status: "pending", updatedAt: "—",
  category: "Quan hệ KH", depends: "base, mail, sales_team",
  menu: "CRM ▸ Sales ▸ My Pipeline",
  purpose: "Quản lý lead → opportunity → won. Kanban pipeline, scoring, activity reminder.",
  features: []
});

export const HR = emptyModule({
  id: "mod_hr", name: "HR", tech: "hr",
  color: "#5BAA50", status: "pending", updatedAt: "—",
  category: "Nhân sự", depends: "base, mail, resource",
  menu: "Employees ▸ Employees",
  purpose: "Hồ sơ nhân viên, phòng ban, chức danh. Cơ sở cho các module Attendance / Payroll / Recruitment.",
  features: []
});

/* ── Notebooks (top-level containers) ── */
export const SEED_DATA = {
  notebooks: [
    {
      id: "nb_odoo18",
      name: "Odoo 18",
      tech: "odoo18",
      color: "#1F6B40",
      icon: "ti-settings",
      tags: ["ERP", "Odoo", "Backend"],
      description: "Sổ tay nghiên cứu các module chuẩn của Odoo 18 — Sales, Purchase, Inventory, Accounting, CRM, HR.",
      updatedAt: "2026-05-13",
      modules: [SALES, PURCHASE, STOCK, ACCOUNT, CRM, HR]
    }
  ]
};

export default SEED_DATA;
