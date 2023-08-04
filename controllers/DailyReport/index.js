"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const bcrypt = require("bcrypt")
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, daily_shop_item } = require("../../components/database")

exports.checkDateInThisMonth = async (req, res, next) => {
  console.log("lastday of month", moment().endOf('month').format("DD"))
  const lastDay = moment().endOf('month').format("DD");
  const arrayDateCheck = [];

  for (let i = 1; i <= +lastDay; i++) {
    let findDateInMonth = await daily_report.findOne({
      raw: true,
      where: {
        date: `${moment().format("YYYY-MM")}-${i}`
      },
      attributes: ["status"]
    })
    if (!findDateInMonth) findDateInMonth = { status: "empty" }
    arrayDateCheck.push({...findDateInMonth, date: i})
  }
  return response.res200(res, "000", "success check date in month", arrayDateCheck)
}

exports.getIsCategoryFilled = async (req, res, next) => {
  if (!req.query.date) return response.res400(res, "date is required.")
  const date = req.query.date

  try {
    const getShopCategoryId = await category.findAll({
      raw: true,
      where: {
        id: {
          [Op.like]: 'shop%'
        }
      },
      attributes: ["id", "name"]
    })
    if (getShopCategoryId.length < 1) return response.res400(res, "error get category id. check the system.")
    console.log(`${moment().format("YYYY-MM")}-${date}`)
    
    const responseCheckCategory = await Promise.all(
      getShopCategoryId.map(async (category) => {
        console.log({category})
        const shopExpenseAssociate = shop_expense_detail.hasOne(daily_report, {foreignKey: "shop_expense_detail_id", sourceKey: "id"})
        const getDailyReport = await shop_expense_detail.findAll({
          raw: true,
          include: [
            {
              association: shopExpenseAssociate,
              required: false,
              attributes: ["id", "date", "shop_expense"]
            }
          ],
          where: {
            date: `${moment().format("YYYY-MM")}-${date}`,
            category_id: category.id
          },
          attributes: ["id", "category_id", "date"],

        })
        console.log({getDailyReport}, category.id)
        return {
          ...category,
          filled: Boolean(getDailyReport.length > 0)
        }
      })
    );

    const shopToday = await daily_report.findOne({
      raw: true,
      where: {
        date: `${moment().format("YYYY-MM")}-${date}`
      },
      attributes: ["id", "shop_expense"]
    })

    console.log({responseCheckCategory}, {shopToday})
    return response.res200(res, "000", "success checking is shop category is filled", { shop_expense: shopToday.shop_expense || 0, responseCheckCategory })
  } catch (error) {
    console.error(error);
    return response.res400(res, "failed to check shop category.")
  }
}

exports.getItemShoppedByCategory = async (req, res, next) => {
  const payload = {
    date: req.query.date,
    category: req.query.category
  }

  if (!payload.date) return response.res400(res, "date is required")
  if (!payload.category) return response.res400(res, "category is required")

  try {
    const getDailyShopItem = await daily_shop_item.findAll({
      raw: true,
      where: {
        category_id: payload.category
      }
    })
    
    let getShopExpenseItem = await shop_expense_detail.findAll({
      raw: true,
      where: {
        date: `${moment().format("YYYY-MM")}-${payload.date}`,
        category_id: payload.category
      },
      attributes: ["id", "category_id", "daily_shop_item_id", "name", "price", "quantity", "unit_type", "status", "date"]
    })

    const mapShopExpense = getDailyShopItem.map((dailyShopItem) => {
      const findAlreadyShopped = getShopExpenseItem.find(shopExpense => shopExpense.daily_shop_item_id === dailyShopItem.id)

      if (!findAlreadyShopped) {
        return { 
          id: null, 
          category_id: dailyShopItem.category_id, 
          daily_shop_item_id: dailyShopItem.id, 
          name: dailyShopItem.name,
          price: 0,
          quantity: 0,
          unit_type: dailyShopItem.unit_type,
          status: null,
          date: null
        }
      } else {
        getShopExpenseItem = getShopExpenseItem.filter(shopExpense => shopExpense.daily_shop_item_id !== dailyShopItem.id && shopExpense.date === `${moment().format("YYYY-MM")}-${payload.date}`)
        console.log({getShopExpenseItem})
        return {
          id: findAlreadyShopped.id, 
          category_id: findAlreadyShopped.category_id, 
          daily_shop_item_id: findAlreadyShopped.daily_shop_item_id, 
          name: findAlreadyShopped.name,
          price: findAlreadyShopped.price,
          quantity: findAlreadyShopped.quantity,
          unit_type: findAlreadyShopped.unit_type,
          status: findAlreadyShopped.status,
          date: findAlreadyShopped.date
        }
      }
    })

    console.log({ mapShopExpense, getShopExpenseItem })
    const testArray = []
    return response.res200(res, "000", "success get data shop", [...mapShopExpense, ...getShopExpenseItem, ...testArray])
  } catch (error) {
    console.error(error)
    return response.res400(res, "error.")
  }
}

exports.addItemShopDailyReport = async (req, res, next) => {
  const payload = {
    item_shop: req.body.item_shop,
    date: req.body.date
  }
  console.log(payload.item_shop)

  if (payload.item_shop.length < 1) return response.res400(res, "Data belum terisi. Silahkan isi data belanja dengan lengkap")
  if (!payload.date) return response.res400(res, "Error. Silahkan hubungi admin.")

  try {
    for (const item of payload.item_shop) {
      let getShopItem = null;
      if (item.daily_shop_item_id !== "additional") {
        getShopItem = await shop_expense_detail.findOne({
          raw: true,
          where: {
            date: `${moment().format("YYYY-MM")}-${payload.date}`,
            daily_shop_item_id: item.daily_shop_item_id
          }
        })

        if (getShopItem) {
          await shop_expense_detail.update(
            {
              category_id: item.category_id,
              daily_shop_item_id: item.daily_shop_item_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              unit_type: item.unit_type,
              status: "filled",
              date: `${moment().format("YYYY-MM")}-${payload.date}`,
              updated_date: new Date()
            },
            {
              where: {
                id: getShopItem.id
              }
            }
          )
        } else getShopItem = null;
      }

      if (!getShopItem) {
        await shop_expense_detail.create(
          {
            id: nanoid(20),
            category_id: item.category_id,
            daily_shop_item_id: item.daily_shop_item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit_type: item.unit_type,
            status: "filled",
            date: `${moment().format("YYYY-MM")}-${payload.date}`,
            created_date: new Date(),
            updated_date: new Date()
          }
        )
      }

      return response.res200(res, "000", "Sukses menambahkan / mengubah data pengeluaran harian.")
    }  
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal menambahkan / mengubah data pengeluaran harian. Silahkan hubungi admin.")
  }
}

exports.deleteDailyShopItemReport = async (req, res, next) => {
  const payload = {
    id: req.body.id
  }

  if (!payload.id) return response.res400(res, "id is required");

  try {
    await shop_expense_detail.destroy({ where: { id: payload.id } });
    return response.res200(res, "000", "Sukses menghapus data dari laporan pengeluaran harian.")
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal menghapus data pengeluaran harian. Silahkan hubungi admin.")
  }
}
