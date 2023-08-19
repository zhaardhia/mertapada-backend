"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const bcrypt = require("bcrypt")
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, monthly_recap, monthly_expense_addition, employee, employee_absence, rent } = require("../../components/database");
const { findCategoryKey, formatRupiah } = require("../../utils/utils")

exports.generateMonthlyRecap = async (req, res, next) => {
  if (!req.body.month) return response.res400(res, "month is required.")
  if (!req.body.year) return response.res400(res, "year is required.")

  const year = req.body.year;
  const month = req.body.month;
  const expenseItems = req.body.expense_items ? req.body.expense_items : null
  const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
  const monthlyRecapId = nanoid(10)

  try {
    const dailyReport = await daily_report.findAll({
      raw: true,
      where: {
        date: {
          [Op.and]: [
            { [Op.gte]: `${year}-${month}-01` },
            { [Op.lt]: `${year}-${Number(month) + 1}-01` }
          ]
        }
      },
      attributes: ["id", "gross_profit", "nett_profit", "shop_expense", "status", "date"]
    })

    const checkStatus = dailyReport.find(report => report.status !== "verified")
    if (checkStatus) return response.res400(res, "Generate laporan laba rugi & laporan bulanan gagal. Silahkan lengkapi data harian terlebih dahulu.")
    if (dailyReport.length !== 31 && dailyReport.length !== 30 && dailyReport.length !== 29 && dailyReport.length !== 28) {
      return response.res400(res, "Generate laporan laba rugi & laporan bulanan gagal. Silahkan lengkapi data harian terlebih dahulu.")
    }

    const getRent = await rent.findAll({
      raw: true,
    })
    if (getRent.length < 1) return response.res400(res, "Gagal mendapatkan biaya sewa.")

    const shopExpenseDetail = await shop_expense_detail.findAll({
      raw: true,
      where: {
        date: {
          [Op.and]: [
            { [Op.gte]: `${year}-${month}-01` },
            { [Op.lt]: `${year}-${Number(month) + 1}-01` }
          ]
        }
      }
    })

    if (shopExpenseDetail.length < 1) return response.res400(res, "Gagal mendapatkan data pengeluaran belanja.")

    const laukPauk = shopExpenseDetail.filter(item => item.category_id === "shop-001")
    const bumbuSayuran = shopExpenseDetail.filter(item => item.category_id === "shop-002")
    const sembakoMinuman = shopExpenseDetail.filter(item => item.category_id === "shop-003")
    const lainLain = shopExpenseDetail.filter(item => item.category_id === "shop-004")

    const employeeInfo = await employee.findAll({
      raw: true,
      where: {
        status: 1
      }
    })
    let totalSalary = 0
    if (employeeInfo.length > 0) {
      for (const employee of employeeInfo) {
        const salaryPerDay = employee.salary / totalDayOfMonth;
        const employeeAbsence = await employee_absence.findAll({
          raw: true,
          where: {
            date: {
              [Op.and]: [
                { [Op.gte]: `${year}-${month}-01` },
                { [Op.lt]: `${year}-${Number(month) + 1}-01` }
              ]
            },
            employee_id: employee.id
          }
        })
        const totalSalary = salaryPerDay * employeeAbsence.length

        for (const absence of employeeAbsence) {
          const findDayReport = await dailyReport.findOne({
            raw: true,
            where: {
              date: absence.date
            },
            attributes: ["id", "employees_salary_expense"]
          })

          const sumSalaryInDay = findDayReport.employees_salary_expense ? +findDayReport.employees_salary_expense + totalSalary : totalSalary
          totalSalary = totalSalary + sumSalaryInDay

          await dailyReport.update(
            {
              employees_salary_expense: sumSalaryInDay
            },
            {
              where: {
                date: absence.date
              }
            }
          )
        }
      }
    }

    
    const gross_profit = dailyReport.reduce((accumulator, item) => {
      return accumulator + item.gross_profit;
    }, 0);
    let shop_expense = dailyReport.reduce((accumulator, item) => {
      return accumulator + item.shop_expense;
    }, 0);
    let nett_profit = dailyReport.reduce((accumulator, item) => {
      return accumulator + item.nett_profit;
    }, 0);
    const total_sewa = getRent.reduce((accumulator, item) => {
      return accumulator + item.fee;
    }, 0);

    const total_lauk_pauk = laukPauk.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const total_bumbu_sayuran = bumbuSayuran.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const total_sembako_minuman = sembakoMinuman.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const total_others = lainLain.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const total_gaji = totalSalary

    const dbTransaction = await db.transaction()

    try {
      if (expenseItems) {
        const additionExpense = expenseItems.reduce((accumulator, item) => {
          return accumulator + item.fee;
        }, 0);
        const arrayExpense = expenseItems.map((item) => {
          return {
            id: nanoid(5),
            monthly_recap_id: monthlyRecapId,
            name: item.name,
            nominal: item.nominal,
            date: item.date,
            created_date: new Date(),
            updated_date: new Date()
          }
        })
        await monthly_expense_addition.bulkCreate(arrayExpense, { transaction: dbTransaction })
  
        shop_expense = shop_expense + additionExpense
        nett_profit = nett_profit - additionExpense
      }
  
      await monthly_recap.create({
        transaction: dbTransaction,
        id: nanoid(10),
        gross_profit,
        shop_expense,
        total_lauk_pauk,
        total_bumbu_sayuran,
        total_sembako_minuman,
        total_others,
        total_gaji,
        total_sewa,
        nett_profit,
        status: "verified",
        date: `${year}-${month}-${totalDayOfMonth}`,
        created_date: new Date(),
        updated_date: new Date()
      })
      await dbTransaction.commit()
    } catch (error) {
      console.error(error)
      await dbTransaction.rollback()
    }
    return response.res200(res, "000", "Sukses generate data bulanan.")
  } catch (error) {
    console.error(error)
    return response.res400(res, "Error creating monthly recap.")
  }
}