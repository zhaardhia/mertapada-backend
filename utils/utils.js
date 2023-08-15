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
