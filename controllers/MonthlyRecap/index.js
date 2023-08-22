"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, monthly_recap, monthly_expense_addition, employee, employee_absence, rent } = require("../../components/database");
const { findCategoryKey, formatRupiah, sideHeader } = require("../../utils/utils")

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

exports.getBagiHasil = async (req, res, next) => {
  const month = req.query.month
  const year = req.query.year

  if (!month || !year) return response.res400(res, "month & date is required.")
  const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();

  try {
    const monthlyRecap = await monthly_recap.findOne({
      raw: true,
      where: {
        date : `${year}-${month}-${totalDayOfMonth}`,
      }
    })
    if (!monthlyRecap) return response.res200(res, "001", "Data bulanan belum ada / belum terverifikasi")

    const getAdditionExpense = await monthly_expense_addition.findAll({
      raw: true,
      where: {
        monthly_recap_id: monthlyRecap.id,
      }
    })

    let totalAddExpense = 0;

    if (getAdditionExpense.length > 0) totalAddExpense = getAdditionExpense.reduce((accumulator, item) => {
      return accumulator + item.nominal;
    }, 0);

    const objResponse = {
      omset: monthlyRecap.gross_profit,
      expense: {
        shopExpense: monthlyRecap.shop_expense,
        laukPauk: monthlyRecap.total_lauk_pauk,
        bumbuSayuran: monthlyRecap.total_bumbu_sayuran,
        sembakoMinuman: monthlyRecap.total_sembako_minuman,
        lainLain: monthlyRecap.total_others,
      },
      ...(getAdditionExpense.length > 0 && {
        additionExpense: {
          additionExpenseTotal: totalAddExpense,
          additionExpenseItems: getAdditionExpense
        }
      }),
      gajiSewa: {
        gajiSewaTotal: (+monthlyRecap.total_gaji) + (+monthlyRecap.total_sewa),
        gaji: monthlyRecap.total_gaji,
        sewa: monthlyRecap.total_sewa
      },
      nettProfit: monthlyRecap.nett_profit,
      transferToInvestor: (monthlyRecap.nett_profit / 2) + monthlyRecap.total_sewa
    }

    return response.res200(res, "000", "Sukses mendapatkan data bulanan.", objResponse)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Error saat mendapatkan data bulanan.")
  }
}

exports.getLaporanBulanan = async (req, res, next) => {
  const month = req.query.month
  const year = req.query.year
  if (!year || !month) return response.res400(res, "month & year are required.")
  const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();

  const dataArray = []
  try {
    const objSayuran = {}
    const objLauk = {}
    const objSembako = {}
    const objLainLain = {}
    const objBahanBaku = {}
    const objDiluarBahanBaku = {}   // tobeconfirmed ini pengeluaran yg diisi tiap bulan terus dibagi hari bulan atau bukan
    const objPengeluaran = {}
    const objPengeluaranCummulative = {}
    const objSalesRevenue = {}
    const objSalesCummulative = {}
    const objPencadangan = {}
    const objHonorKaryawan = {}
    const objBiayaSewa = {}
    const objPencadanganPerBulan = {}
    const objCadanganAwalCum = {}
    const objCadanganAkhirCum = {}
    const objNetProfitCum = {}
    const objViewInvestor = {}
    const objCashInInvestor = {}
    const objDariCustomerInvestor = {}
    const objCashOutInvestor = {}
    const objPengeluaranInvestor = {}
    const objNetCashInvestor = {}
    const objKasAwalInvestor = {}
    const objKasAkhirInvestor = {}
    const objViewPengelola = {}
    const objCashInPengelola = {}
    const objDariCustomerPengelola = {}
    const objCashOutPengelola = {}
    const objPembelianPengelola = {}
    const objPencadanganPengelola = {}
    const objNetCashPengelola = {}
    const objKasAwalPengelola = {}
    const objKasAkhirPengelola = {}

    for (let i = 1; i < totalDayOfMonth; i++) {
      const dateFormat = i < 10 ? `0${i}` : i
      const monthFormat = month < 10 ? `0${month}` : i

      const findDailyReportInDay = await daily_report.findOne({
        raw: true,
        where: {
          date: `${dateFormat}-${monthFormat}-${year}`
        }
      })
      const findShopExpenseInDay = await shop_expense_detail.findAll({
        raw: true,
        where: {
          date: `${dateFormat}-${monthFormat}-${year}`
        }
      })

      const onlyLauk = findShopExpenseInDay.filter(lauk => lauk.category_id === "shop-001")
      const total_lauk_pauk = onlyLauk.reduce((accumulator, item) => {
        return accumulator + item.price;
      }, 0);

      const onlySayuran = findShopExpenseInDay.filter(lauk => lauk.category_id === "shop-002")
      const total_bumbu_sayuran = onlySayuran.reduce((accumulator, item) => {
        return accumulator + item.price;
      }, 0);

      const onlySembako = findShopExpenseInDay.filter(lauk => lauk.category_id === "shop-003")
      const total_sembako_minuman = onlySembako.reduce((accumulator, item) => {
        return accumulator + item.price;
      }, 0);

      const onlyOthers = findShopExpenseInDay.filter(lauk => lauk.category_id === "shop-004")
      const total_others = onlyOthers.reduce((accumulator, item) => {
        return accumulator + item.price;
      }, 0);

      // if (i === 1) {     
      //   objLauk[`day${i}`] = total_lauk_pauk
      //   objSayuran[`day${i}`] = total_bumbu_sayuran
      //   objSembako[`day${i}`] = total_sembako_minuman
      //   objLainLain[`day${i}`] = total_others

      // } else {
      //   objLauk[`day${i}`] = objLauk[`day${i}`] + total_lauk_pauk
      //   objSayuran[`day${i}`] = objSayuran[`day${i}`] + total_bumbu_sayuran
      //   objSembako[`day${i}`] = objSembako[`day${i}`] + total_sembako_minuman
      //   objLainLain[`day${i}`] = objLainLain[`day${i}`] + total_others
      // }

      // if (i !== totalDayOfMonth) {
      //   objLauk[`day${i + 1}`] = total_lauk_pauk
      //   objSayuran[`day${i + 1}`] = total_bumbu_sayuran
      //   objSembako[`day${i + 1}`] = total_sembako_minuman
      //   objLainLain[`day${i + 1}`] = total_others
      // }
      
      objLauk[`day${i}`] = total_lauk_pauk
      objSayuran[`day${i}`] = total_bumbu_sayuran
      objSembako[`day${i}`] = total_sembako_minuman
      objLainLain[`day${i}`] = total_others
      objBahanBaku[`day${i}`] = findDailyReportInDay.shop_expense
      objPengeluaran[`day${i}`] = findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional pengeluaran

      if (i === 1) {     
        objPengeluaranCummulative[`day${i}`] = objPengeluaran[`day${i}`]
      } else {
        objPengeluaranCummulative[`day${i}`] =  objPengeluaranCummulative[`day${i}`] + objPengeluaran[`day${i}`]
      }

      if (i !== totalDayOfMonth) {
        objPengeluaranCummulative[`day${i}`] = objPengeluaran[`day${i}`]
      }
    }

    for (const category of sideHeader) {
      
    }
  } catch (error) {
    
  }
}