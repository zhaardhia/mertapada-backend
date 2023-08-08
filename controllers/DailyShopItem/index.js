"use strict"
const { db, category, daily_report, shop_expense_detail, daily_shop_item, employee, employee_absence } = require("../../components/database");
const response = require("../../components/response")

exports.insertDailyShopItem = async (req, res, next) => {
  /* 
    item_shop = [
      {
        id: xx,
        category_id: shop-001,
        name: xxx,
        unit_type: kg
      }
    ]
  */

  const itemShop = req.body.itemShop
  
  for (const item of itemShop) {
    await daily_shop_item.create(
      {
        id: item.id,
        category_id: item.category_id,
        name: item.name,
        unit_type: item.unit_type,
        created_date: new Date(),
        updated_date: new Date()
      }
    )
  }
  return response.res200(res, "000", "mantap cok")
}