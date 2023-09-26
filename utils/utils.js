"use strict"

exports.findCategoryKey = (categoryId) => {
  switch (categoryId) {
    case "shop-001":
      return "laukPauk"
    case "shop-002":
      return "bumbuSayuran"
    case "shop-003":
      return "sembakoMinuman"
    case "shop-004":
      return "lainLain"
  }
}

exports.formatRupiah = (number) => {
  if (number) return number.toLocaleString('id-ID');
  return '0'
}

exports.sideHeader = [
  {
    name: "Bahan Baku",
    isHeader: true,
    isBold: true
  },
  {
    name: "Sayuran",
    isHeader: false,
    isBold: false
  },
  {
    name: "Lauk",
    isHeader: false,
    isBold: false
  },
  {
    name: "Sembako",
    isHeader: false,
    isBold: false
  },
  {
    name: "Lain-Lain",
    isHeader: false,
    isBold: false
  },
  {
    name: "Total Bahan Baku",
    isHeader: true,
    isBold: true
  },
  {
    name: "Total Di luar Bahan Baku",
    isHeader: true,
    isBold: true
  },
  {
    name: "Total Pengeluaran",
    isHeader: true,
    isBold: true
  },
  {
    name: "Pengeluaran Cummulative",
    isHeader: false,
    isBold: false
  },
  {
    name: "Sales-Revenue",
    isHeader: true,
    isBold: true
  },
  {
    name: "Sales Cummulative",
    isHeader: true,
    isBold: true
  },
  {
    name: "Pencadangan",
    isHeader: true,
    isBold: false
  },
  {
    name: "Honor Karyawan",
    isHeader: false,
    isBold: false
  },
  {
    name: "Biaya Sewa",
    isHeader: false,
    isBold: false
  },
  {
    name: "Pencadangan/Bulan",
    isHeader: true,
    isBold: true
  },
  {
    name: "Cadangan Awal (Kumulatif)",
    isHeader: true,
    isBold: false
  },
  {
    name: "Cadangan Akhir (Kumulatif)",
    isHeader: true,
    isBold: false
  },
  {
    name: "Net Profit Cummulative",
    isHeader: true,
    isBold: false
  },
  {
    name: "View Investor",
    isHeader: true,
    isBold: true
  },
  {
    name: "Cash In",
    isHeader: true,
    isBold: false
  },
  {
    name: "Dari Customer",
    isHeader: false,
    isBold: false
  },
  {
    name: "Cash Out",
    isHeader: true,
    isBold: false
  },
  {
    name: "Pengeluaran",
    isHeader: false,
    isBold: false
  },
  {
    name: "Net Cash",
    isHeader: true,
    isBold: false
  },
  {
    name: "Kas Awal",
    isHeader: true,
    isBold: false
  },
  {
    name: "Kas Akhir",
    isHeader: true,
    isBold: false
  },
  {
    name: "View Pengelola",
    isHeader: true,
    isBold: true
  },
  {
    name: "Cash In",
    isHeader: true,
    isBold: false
  },
  {
    name: "Dari Customer",
    isHeader: false,
    isBold: false
  },
  {
    name: "Cash Out",
    isHeader: true,
    isBold: false
  },
  {
    name: "Pembelian",
    isHeader: false,
    isBold: false
  },
  {
    name: "Pencadangan",
    isHeader: false,
    isBold: false
  },
  {
    name: "Net Cash",
    isHeader: true,
    isBold: false
  },
  {
    name: "Kas Awal",
    isHeader: true,
    isBold: false
  },
  {
    name: "Kas Akhir",
    isHeader: true,
    isBold: false
  }
]

exports.getCurrentDayMonthYear = (date) => {
  return `${moment("2023-07").format(`YYYY-MM-${date}`)}`
}