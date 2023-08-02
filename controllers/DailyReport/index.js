"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const bcrypt = require("bcrypt")
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail } = require("../../components/database")

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