"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const bcrypt = require("bcrypt")
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report } = require("../../components/database")

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
        const getDailyReport = await daily_report.findAll({
          raw: true,
          where: {
            date: `${moment().format("YYYY-MM")}-${date}`
          },
          attributes: ["id", "date"]
        })
        return {
          ...category,
          filled: Boolean(getDailyReport.length > 0)
        }
      })
    );

    console.log({getShopCategoryId})
    return response.res200(res, "000", "success checking is shop category is filled", responseCheckCategory)
  } catch (error) {
    console.error(error);
    return response.res400(res, "failed to check shop category.")
  }
}