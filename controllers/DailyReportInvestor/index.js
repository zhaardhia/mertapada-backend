"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, daily_shop_item, employee, employee_absence } = require("../../components/database");
const { findCategoryKey, formatRupiah } = require("../../utils/utils")

exports.checkDateInThisMonth = async (req, res, next) => {
  const monthYear = req.query.monthYear;
  if (!monthYear) return response.res400(res, "Harus masukkan bulan dan tahun")

  const lastDay = moment(monthYear).endOf('month').format("DD");
  const arrayDateCheck = [];

  for (let i = 1; i <= +lastDay; i++) {
    let findDateInMonth = await daily_report.findOne({
      raw: true,
      where: {
        date: `${monthYear}-${i}`
      },
      attributes: ["status"]
    })
    if (!findDateInMonth) findDateInMonth = { status: "empty" }
    findDateInMonth.isDisabled = ((monthYear === moment().format("YYYY-MM") && i >= +moment().format("DD")) || moment(`${monthYear}-${i}`).isBefore(process.env.CREATED_DATE_PROJECT))
    findDateInMonth.fullDate = monthYear + "-" + (i < 10 ? '0'+i : i)
    arrayDateCheck.push({...findDateInMonth, date: `${i < 10 ? '0'+i : i}`})
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
    
    let isReadyToVerifCategory = true;
    const responseCheckCategory = await Promise.all(
      getShopCategoryId.map(async (category, index) => {
        const getDailyReport = await shop_expense_detail.findAll({
          raw: true,
          where: {
            date: date,
            category_id: category.id
          },
          attributes: ["id", "category_id", "date"],

        })

        if (!getDailyReport.length > 0) isReadyToVerifCategory = false;
        return {
          ...category,
          filled: Boolean(getDailyReport.length > 0)
        }
      })
    );

    const shopToday = await daily_report.findOne({
      raw: true,
      where: {
        date: date
      },
      attributes: ["id", "shop_expense", "status"]
    })

    const shopTodayHehe = await shop_expense_detail.findAll({
      raw: true,
      where: {
        date: date
      },
      attributes: ["id", "price"]
    })

    const totalValue = shopTodayHehe.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);

    let isVerified = false
    if (!shopToday) isVerified = false
    else isVerified = shopToday.status === "verified_shop_expense" || shopToday.status === "verified"

    return response.res200(res, "000", "success checking is shop category is filled", { 
      daily_report_id: shopToday ? shopToday.id : null, 
      shop_expense: shopToday && shopToday.shop_expense ? shopToday.shop_expense : 0, 
      isReadyToVerifCategory, 
      isVerified, 
      responseCheckCategory 
    })
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
        date: payload.date,
        category_id: payload.category
      },
      attributes: ["id", "category_id", "daily_shop_item_id", "name", "price", "quantity", "unit_type", "status", "date"]
    })

    const mapShopExpense = getDailyShopItem.map((dailyShopItem) => {
      const findAlreadyShopped = getShopExpenseItem.find(shopExpense => shopExpense.daily_shop_item_id === dailyShopItem.id)

      if (!findAlreadyShopped) {
        return { 
          id: nanoid(10), 
          category_id: dailyShopItem.category_id, 
          daily_shop_item_id: dailyShopItem.id, 
          name: dailyShopItem.name,
          price: 0,
          quantity: 0,
          unit_type: dailyShopItem.unit_type,
          status: null,
          date: payload.date
        }
      } else {
        getShopExpenseItem = getShopExpenseItem.filter(shopExpense => shopExpense.daily_shop_item_id !== dailyShopItem.id && shopExpense.date === payload.date)

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

    const getDailyReport = await daily_report.findOne({
      raw: true,
      where: {
        date: payload.date
      },
      attributes: ["id", "shop_expense", "date", "status"]
    })

    const getDailyReportInMonth = await daily_report.findOne({
      raw: true,
      where: {
        status: "verified"
      },
      order: [['date', 'DESC']],
      limit: 1,
      attributes: ["date"]
    })
    
    let shopExpense = getDailyReport ? getDailyReport.shop_expense : 0
    const isVerified = Boolean((getDailyReport && getDailyReport.status === "verified") || (getDailyReport && getDailyReport.status === "verified_shop_expense"))
    // const isEditable = (payload.date === moment().subtract(1, "days").format("YYYY-MM-DD"))

    const isEditable = (getDailyReportInMonth && payload.date === getDailyReportInMonth.date)

    return response.res200(res, "000", "success get data shop", { items: [...mapShopExpense, ...getShopExpenseItem], shopExpense, isVerified, isEditable})
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

  const getDailyReportInMonth = await daily_report.findOne({
    raw: true,
    where: {
      status: "verified"
    },
    order: [['date', 'DESC']],
    limit: 1,
    attributes: ["date"]
  })

  if (getDailyReportInMonth && payload.date !== getDailyReportInMonth.date) return response.res400(res, "Anda tidak diizinkan untuk mengubah data ini.")
  if (payload.item_shop.length < 1) return response.res400(res, "Data belum terisi. Silahkan isi data belanja dengan lengkap")
  if (!payload.date) return response.res400(res, "Error. Silahkan hubungi admin.")

  const getDailyReport = await daily_report.findOne({
    raw: true,
    where: {
      date: payload.date
    },
    attributes: ["id", "main_profit", "other_profit", "absence_detail_id", "shop_expense"]
  })

  const daily_report_id = getDailyReport ? getDailyReport.id : nanoid(20);
  let shopExpense = getDailyReport ? +getDailyReport.shop_expense : 0;

  if (!getDailyReport) {
    await daily_report.create({
      id: daily_report_id,
      status: "filled",
      date: payload.date,
      created_date: new Date(),
      updated_date: new Date()
    })
  }

  const dbTransaction = await db.transaction()
  try {
    for (const item of payload.item_shop) {
      let getShopItem = await shop_expense_detail.findOne({
        raw: true,
        where: {
          id: item.id,
          date: payload.date,
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
            date: payload.date,
            updated_date: new Date()
          },
          {
            where: {
              id: getShopItem.id
            },
            transaction: dbTransaction
          }
        )
        shopExpense = shopExpense - getShopItem.price
      }

      if (!getShopItem) {
        await shop_expense_detail.create(
          {
            transaction: dbTransaction,
            id: item.id,
            category_id: item.category_id,
            daily_report_id,
            daily_shop_item_id: item.daily_shop_item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit_type: item.unit_type,
            status: "filled",
            date: payload.date,
            created_date: new Date(),
            updated_date: new Date()
          }
        )
      }
      shopExpense = shopExpense + (+item.price)

      const getDailyReport = await daily_report.findOne({
        raw: true,
        where: {
          date: payload.date
        },
        attributes: ["id", "gross_profit", "main_profit", "other_profit", "shop_expense", "currentbalance"]
      })
    
      // calculate this if using algorithm for investor to edit this only on state "verified"
      const grossProfit = +getDailyReport.gross_profit === +getDailyReport.main_profit + +getDailyReport.other_profit ? +getDailyReport.gross_profit : +getDailyReport.main_profit + +getDailyReport.other_profit
      const nettProfit = grossProfit - shopExpense

      await daily_report.update(
        {
          shop_expense: shopExpense,
          // status: "filled"   // comment this for investor to edit this only on state "verified"
          nett_profit: nettProfit // use this for investor to edit this only on state "verified"
        },
        {
          where: {
            id: daily_report_id
          },
          transaction: dbTransaction
        }
      )
    }
    await dbTransaction.commit()
    return response.res200(res, "000", "Sukses menambahkan / mengubah data pengeluaran harian.")
  } catch (error) {
    console.error(error)
    await dbTransaction.rollback()
    return response.res400(res, "Gagal menambahkan / mengubah data pengeluaran harian. Silahkan hubungi admin.")
  }
}

exports.deleteDailyShopItemReport = async (req, res, next) => {
  const payload = {
    id: req.body.id,
    date: req.body.date
  }

  if (!payload.id) return response.res400(res, "id is required");

  const findItem = await shop_expense_detail.findOne({
    raw: true,
    where: {
      id: payload.id
    },
    attributes: ["id", "name", "price"]
  })
  if (!findItem) return response.res400(res, "Item tidak ditemukan")

  const findReport = await daily_report.findOne({
    raw: true,
    where: {
      date: `${moment(payload.date).format("YYYY-MM-DD")}`
    },
    attributes: ["id", "gross_profit", "nett_profit", "shop_expense", "currentbalance", "prevbalance", "status"]
  })

  // calculate this if using algorithm for investor to edit this only on state "verified"
  const grossProfit = +findReport.gross_profit
  const nettProfit = grossProfit - (Number(findReport.shop_expense) - Number(findItem.price))

  try {
    await shop_expense_detail.destroy({ where: { id: payload.id } });
    await daily_report.update(
      {
        shop_expense: Number(findReport.shop_expense) - Number(findItem.price),
        nett_profit: nettProfit,
        currentbalance: Number(findReport.prevbalance) + nettProfit
      },
      { 
        where: { 
          date: `${moment(july).format("YYYY-MM")}-${payload.date}`
        }
      }
    );
    return response.res200(res, "000", "Sukses menghapus data dari laporan pengeluaran harian.")
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal menghapus data pengeluaran harian. Silahkan hubungi admin.")
  }
}

exports.verifiedExpenseAllCategoryItem = async (req, res, next) => {
  const id = req.body.id
  const date = req.body.date
  if (!date) return response.res400(res, "date is required. please check the system.")
  // if (date !== moment().subtract(1, "days").format("YYYY-MM-DD")) return response.res400(res, "Anda tidak diizinkan untuk mengakses ini.")

  try {
    await daily_report.update(
      {
        status: "verified_shop_expense"
      },
      {
        where: {
          id,
          date: date
        }
      }
    )
    return response.res200(res, "000", `Sukses memverifikasi data pengeluaran harian tanggal ${date}. Silahkan untuk melanjutkan pengisian data harian berikutnya.`)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal verifikasi pengeluaran belanja harian. Silahkan hubungi admin.")
  }
}

exports.getStatusOmsetAndAbsenceToday = async (req, res, next) => {
  const date = req.query.date;
  if (!date) return response.res400(res, "date is required.")

  try {
    const getStatusOmsetAndAbsence = await daily_report.findOne({
      raw: true,
      where: {
        date: date
      },
      attributes: ["id", "main_profit", "other_profit", "absence_detail_id", "status"]
    })
    if (!getStatusOmsetAndAbsence) return response.res400(res, "Silahkan isi data belanja terlebih dahulu.")
    
    const responseStatusOmsetAndAbsence = {
      daily_report_id: getStatusOmsetAndAbsence.id,
      omset_filled: (getStatusOmsetAndAbsence.main_profit && getStatusOmsetAndAbsence.other_profit) ? true : false,
      absence_filled: getStatusOmsetAndAbsence.absence_detail_id ? true : false,
      isReadyToVerif: Boolean(getStatusOmsetAndAbsence.main_profit && getStatusOmsetAndAbsence.other_profit && getStatusOmsetAndAbsence.absence_detail_id),
      isVerified: getStatusOmsetAndAbsence.status === "verified",
    }
    return response.res200(res, "000", `Sukses mendapatkan data status omset dan absen tanggal ${moment().format("YYYY-MM")}-${date}.`, responseStatusOmsetAndAbsence)
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal mengambil status data omset dan absen")
  }
}

exports.getOmsetForThisDay = async (req, res, next) => {
  const id = req.query.id
  const date = req.query.date
  try {
    const getOmsetThisDay = await daily_report.findOne({
      raw: true,
      where: {
        id,
        date: date
      },
      attributes: ["id", "gross_profit", "main_profit", "other_profit", "status"]
    })
    const getDailyReportInMonth = await daily_report.findOne({
      raw: true,
      where: {
        status: "verified"
      },
      order: [['date', 'DESC']],
      limit: 1,
      attributes: ["date"]
    })
    const responseOmset = {
      ...getOmsetThisDay,
      isVerified: Boolean(getOmsetThisDay.status === "verified"),
      isEditable: date === getDailyReportInMonth.date
    }
    if (!responseOmset.id) responseOmset.id = null;
    if (!responseOmset.gross_profit) responseOmset.gross_profit = 0;
    if (!responseOmset.main_profit) responseOmset.main_profit = 0;
    if (!responseOmset.other_profit) responseOmset.other_profit = 0;

    delete responseOmset.status
    return response.res200(res, "000", `Sukses mendapatkan data omset tanggal ${date}.`, responseOmset);
  } catch (error) {
    console.error(error)
    return response.res400(res, )
  }
}

exports.insertUpdateOmzet = async (req, res, next) => {
  const id = req.body.id;
  const date = req.body.date;
  const main_profit = +req.body.main_profit;
  const other_profit = +req.body.other_profit || 0;

  if (!date) return response.res400(res, "date is required.")
  if (!main_profit) return response.res400(res, "Omset Utama tidak boleh kosong.")
  // if (date !== moment().subtract(1, "days").format("YYYY-MM-DD")) return response.res400(res, "Anda tidak diizinkan untuk mengakses ini.")

  const findReport = await daily_report.findOne({
    raw: true,
    where: {
      id,
      date: date
    },
    attributes: ["id", "gross_profit", "nett_profit", "main_profit", "other_profit", "shop_expense", "currentbalance", "prevbalance"]
  })

  const grossProfit = Number(main_profit) + Number(other_profit)
  const nettProfit = grossProfit - Number(findReport.shop_expense)
  try {
    await daily_report.update(
      {
        main_profit,
        ...(other_profit && { other_profit }),
        gross_profit: grossProfit,
        nett_profit: nettProfit,
        currentbalance: Number(findReport.prevbalance) + nettProfit,
      },
      {
        where: {
          id,
          date: date
        }
      }
    )
    return response.res200(res, "000", "Sukses menginput nilai omset.")
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal menginput nilai omset. Silahkan hubungi admin.")
  }
}

exports.getAbsence = async (req, res, next) => {
  const date = req.query.date;
  if (!date) return response.res400(res, "date is required.")

  try {
    const getAllEmployee = await employee.findAll({
      raw: true,
      where: {
        status: 1,
      },
      attributes: ["id", "name", "salary"]
    })
    if (getAllEmployee.length < 1) return response.res400(res, "Data karyawan tidak ada.");

    const responseAbsence = await Promise.all(
      getAllEmployee.map(async (employee_entity) => {
        const getEmployeeAbsence = await employee_absence.findOne({
          raw: true,
          where: {
            date: date,
            employee_id: employee_entity.id
          }
        })
        return {
          ...employee_entity,
          is_present: Boolean(getEmployeeAbsence && getEmployeeAbsence.is_present == 1)
        }
      })
    );

    const getDailyReport = await daily_report.findOne({
      raw: true,
      where: {
        date: date
      },
      attributes: ["id", "status"]
    })

    const getDailyReportInMonth = await daily_report.findOne({
      raw: true,
      where: {
        status: "verified"
      },
      order: [['date', 'DESC']],
      limit: 1,
      attributes: ["date"]
    })

    const isVerified = Boolean(getDailyReport.status === "verified")
    const isEditable = (date === getDailyReportInMonth.date)

    return response.res200(res, "000", "Sukses mendapatkan data absen karyawan.", { absence: responseAbsence, isVerified: isVerified, isEditable })
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal mendapatkan data absen. Silahkan hubungi admin.")
  }
}

exports.insertUpdateAbsence = async (req, res, next) => {
  /*
    sample absence array = [
      employee_id: xxx,
      is_present: true
    ],
    date: xxx,
    all_not_present: xxx
  */

  const absenceItem = req.body.absence_item;
  const date = req.body.date;
  const allNotPresent = req.body.allNotPresent;

  if (!date) return response.res400(res, "Error. Silahkan hubungi admin.");
  // if (date !== moment().subtract(1, "days").format("YYYY-MM-DD")) return response.res400(res, "Anda tidak diizinkan untuk mengakses ini.")
  if (absenceItem.length < 1 && (allNotPresent === null || allNotPresent === undefined)) return response.res400(res, "Data belum terisi. Silahkan isi data absen dengan lengkap");

  const getCurrentStateAbsenceReport = await daily_report.findOne({
    raw: true,
    where: {
      date: date
    },
    attributes: ["id", "absence_detail_id"]
  })

  let absence_detail_id = getCurrentStateAbsenceReport.absence_detail_id || null;
  const dbTransaction = await db.transaction()
  try {
    if (!getCurrentStateAbsenceReport.absence_detail_id) {    // first time
      absence_detail_id = nanoid(10)

      await daily_report.update(
        {
          absence_detail_id
        },
        {
          where: {
            id: getCurrentStateAbsenceReport.id,
            date: date
          },
          transaction: dbTransaction
        }
      )

      // if (allNotPresent) {  // rare case
      for (const absence of absenceItem) {
        await employee_absence.create({
          transaction: dbTransaction,
          id: nanoid(20),
          employee_id: absence.id,
          absence_detail_id,
          is_present: allNotPresent ? 0 : absence.is_present === true ? 1 : 0,
          date: date,
          created_date: new Date(),
          updated_date: new Date()
        })
      }
    } else {
      for (const absence of absenceItem) {
        const getCurrentAbsence = await employee_absence.findOne({
          raw: true,
          where: {
            employee_id: absence.id,
            date: date,
            absence_detail_id
          }
        })

        if (getCurrentAbsence) {
          await employee_absence.update(
            {
              is_present: allNotPresent ? 0 : absence.is_present === true ? 1 : 0
            },
            {
              where: {
                employee_id: absence.id,
                date: date,
                absence_detail_id
              },
              transaction: dbTransaction
            }
          )
        } else {
          await employee_absence.create({
            transaction: dbTransaction,
            id: nanoid(20),
            employee_id: absence.id,
            absence_detail_id,
            is_present: allNotPresent ? 0 : absence.is_present === true ? 1 : 0,
            date: date,
            created_date: new Date(),
            updated_date: new Date()
          })
        }
      }
    }

    await dbTransaction.commit();
    return response.res200(res, "000", "Sukses menambahkan / mengubah data absen.");
    
  } catch (error) {
    console.error(error);
    await dbTransaction.rollback();
    return response.res400(res, "Gagal menambahkan / mengubah data absen.")
  }
}

exports.verifiedOmsetAndAbsence = async (req, res, next) => {
  const id = req.body.id
  const date = req.body.date
  const sure = req.body.sure

  if (!sure || sure !== "SAYA YAKIN") return response.res400(res, "Anda belum mengetikkan kalimat dengan benar.")
  if (!date) return response.res400(res, "date is required. please check the system.")

  // if (date !== moment().subtract(1, "days").format("YYYY-MM-DD")) return response.res400(res, "Anda tidak diizinkan untuk mengakses ini.")
  const getDailyReport = await daily_report.findOne({
    raw: true,
    where: {
      id,
      date: date
    },
    attributes: ["id", "gross_profit", "main_profit", "other_profit", "shop_expense", "currentbalance"]
  })

  if (!getDailyReport) return response.res400(res, "Silahkan lengkapi semua data laporan sebelum verifikasi")

  const grossProfit = +getDailyReport.gross_profit === +getDailyReport.main_profit + +getDailyReport.other_profit ? +getDailyReport.gross_profit : +getDailyReport.main_profit + +getDailyReport.other_profit

  const nettProfit = grossProfit - +getDailyReport.shop_expense

  // moment('2023-08-11').subtract(5, 'days').format("YYYY-MM-DD")
  const now = date
  const getDailyReportYesterday = await daily_report.findOne({
    raw: true,
    where: {
      id,
      date: `${moment(now).subtract(1, 'days').format("YYYY-MM-DD")}`
    },
    attributes: ["id", "gross_profit", "main_profit", "other_profit", "shop_expense", "currentbalance"]
  })

  const prevBalance = getDailyReportYesterday ? getDailyReportYesterday.currentbalance : 0
  try {
    await daily_report.update(
      {
        nett_profit: nettProfit,
        currentbalance: +prevBalance + +nettProfit,
        prevbalance: prevBalance,
        status: "verified"
      },
      {
        where: {
          id,
          date: date
        }
      }
    )
    return response.res200(res, "000", `Sukses memverifikasi data laporan harian ${moment().format("YYYY-MM")}-${date}. Silahkan melanjutkan untuk melihat rekap data & download file.`)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal verifikasi laporan harian. Silahkan hubungi admin.")
  }
}

exports.getFinalRecap = async (req, res, next) => {
  if (!req.query.date) return response.res400(res, "date is required")

  const date = req.query.date

  const resFinalRecap = await daily_report.findOne({
    raw: true,
    where: {
      date: date
    },
    attributes: ["id", "gross_profit", "nett_profit", "shop_expense", "prevbalance", "currentbalance"]
  })

  if (!resFinalRecap) return response.res400(res, "error. check the system")

  return response.res200(res, "000", "Sukses mengambil data rekap final.", resFinalRecap)
}

exports.getFinalRecapDetail = async (req, res, next) => {
  const id = req.query.id
  const date = req.query.date

  try {
    const getCategoryShop = await category.findAll({
      raw: true,
      where: {
        id: {
          [Op.like]: 'shop%'
        }
      },
      attributes: ["id", "name"]
    })

    let responseObj = {}
    for (const category of getCategoryShop) {
      const getShopExpenseByCategory = await shop_expense_detail.findAll({
        raw: true,
        where: {
          daily_report_id: id,
          category_id: category.id,
          date: date
        },
        attributes: ["name", "quantity", "unit_type", "price"]
      })
      if (getShopExpenseByCategory.length < 1) return response.res400(res, "Gagal mengambil data belanjaan.")

      const mapExpense = getShopExpenseByCategory.map((shopExpense) => {
        return {
          ...shopExpense,
          category: category.name,
          price: formatRupiah(shopExpense.price),
          quantity: String(shopExpense.quantity)
        }
      })
      const totalPrice = getShopExpenseByCategory.reduce((accumulator, item) => {
        return accumulator + item.price;
      }, 0);

      responseObj[findCategoryKey(category.id)] = mapExpense
      responseObj[`${findCategoryKey(category.id)}TotalPrice`] = totalPrice
    }

    const getDailyReport = await daily_report.findOne({
      raw: true,
      where: {
        id,
        date: date
      },
      attributes: ["id", "currentbalance", "prevbalance", "nett_profit", "gross_profit", "shop_expense"]
    })
    responseObj = { ...responseObj, ...getDailyReport }
    return response.res200(res, "000", "Sukses mendapatkan data detail rekap final", responseObj)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal mengambil data detail rekap final")
  }
}
