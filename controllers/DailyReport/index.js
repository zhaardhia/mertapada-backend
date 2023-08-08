"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const bcrypt = require("bcrypt")
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, daily_shop_item, employee, employee_absence } = require("../../components/database");

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
  console.log("AKAKAKAKAKAK")
  if (!req.query.date) return response.res400(res, "date is required.")
  const date = req.query.date
  console.log({date}, "KWOKok")
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
      getShopCategoryId.map(async (category, index) => {
        console.log({category})
        console.log({index})
        // const shopExpenseAssociate = shop_expense_detail.hasOne(daily_report, {foreignKey: "shop_expense_detail_id", sourceKey: "id"})
        const getDailyReport = await shop_expense_detail.findAll({
          raw: true,
          // include: [
          //   {
          //     association: shopExpenseAssociate,
          //     required: false,
          //     attributes: ["id", "date", "shop_expense"]
          //   }
          // ],
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
    return response.res200(res, "000", "success checking is shop category is filled", { shop_expense: shopToday && shopToday.shop_expense ? shopToday.shop_expense : 0, responseCheckCategory })
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
          id: nanoid(10), 
          category_id: dailyShopItem.category_id, 
          daily_shop_item_id: dailyShopItem.id, 
          name: dailyShopItem.name,
          price: 0,
          quantity: 0,
          unit_type: dailyShopItem.unit_type,
          status: null,
          date: `${moment().format("YYYY-MM")}-${payload.date}`
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

    const getDailyReport = await daily_report.findOne({
      raw: true,
      where: {
        date: `${moment().format("YYYY-MM")}-${payload.date}`
      },
      attributes: ["id", "shop_expense", "date"]
    })
    
    let shopExpense = getDailyReport ? getDailyReport.shop_expense : 0


    console.log({ mapShopExpense, getShopExpenseItem })
    return response.res200(res, "000", "success get data shop", { items: [...mapShopExpense, ...getShopExpenseItem], shopExpense})
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

  const getDailyReport = await daily_report.findOne({
    raw: true,
    where: {
      date: `${moment().format("YYYY-MM")}-${payload.date}`
    },
    attributes: ["id", "main_profit", "other_profit", "absence_detail_id"]
  })

  const daily_report_id = getDailyReport ? getDailyReport.id : nanoid(20);
  let shopExpense = 0;

  if (!getDailyReport) {
    await daily_report.create({
      id: daily_report_id,
      status: "filled",
      date: `${moment().format("YYYY-MM")}-${payload.date}`,
      created_date: new Date(),
      updated_date: new Date()
    })
  }

  try {
    for (const item of payload.item_shop) {
      console.log({item})
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
            id: item.id,
            category_id: item.category_id,
            daily_report_id,
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
      shopExpense = shopExpense + item.price
    }

    await daily_report.update(
      {
        shop_expense: shopExpense
      },
      {
        where: {
          id: daily_report_id
        }
      }
    )
    return response.res200(res, "000", "Sukses menambahkan / mengubah data pengeluaran harian.")
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

exports.verifiedExpenseAllCategoryItem = async (req, res, next) => {
  const id = req.body.id
  const date = req.body.date
  if (!date) return response.res400(res, "date is required. please check the system.")

  try {
    await daily_report.update(
      {
        status: "verified_shop_expense"
      },
      {
        where: {
          id,
          date: `${moment().format("YYYY-MM")}-${date}`
        }
      }
    )
    return response.res200(res, "000", `Sukses memverifikasi data pengeluaran harian tanggal ${moment().format("YYYY-MM")}-${date}. Silahkan untuk melanjutkan pengisian data harian berikutnya.`)
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
        date: `${moment().format("YYYY-MM")}-${date}`
      },
      attributes: ["id", "main_profit", "other_profit", "absence_detail_id"]
    })
    if (!getStatusOmsetAndAbsence) return response.res400(res, "Silahkan isi data belanja terlebih dahulu.")
    
    const responseStatusOmsetAndAbsence = {
      daily_report_id: getStatusOmsetAndAbsence.id,
      omset_filled: (getStatusOmsetAndAbsence.main_profit && getStatusOmsetAndAbsence.other_profit) ? true : false,
      absence_filled: getStatusOmsetAndAbsence.absence_detail_id ? true : false,
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
        date: `${moment().format("YYYY-MM")}-${date}`
      },
      attributes: ["id", "gross_profit", "main_profit", "other_profit"]
    })
    const responseOmset = {
      ...getOmsetThisDay
    }
    if (!responseOmset.id) responseOmset.id = null;
    if (!responseOmset.gross_profit) responseOmset.gross_profit = 0;
    if (!responseOmset.main_profit) responseOmset.main_profit = 0;
    if (!responseOmset.other_profit) responseOmset.other_profit = 0;
    
    return response.res200(res, "000", `Sukses mendapatkan data omset tanggal ${moment().format("YYYY-MM")}-${date}.`, responseOmset);
  } catch (error) {
    console.error(error)
    return response.res400(res, )
  }
}

exports.insertUpdateOmzet = async (req, res, next) => {
  const id = req.body.id;
  const date = req.body.date;
  const main_profit = req.body.main_profit;
  const other_profit = req.body.other_profit || 0;

  if (!date) return response.res400(res, "date is required.")
  if (!main_profit) return response.res400(res, "Omset Utama tidak boleh kosong.")

  try {
    await daily_report.update(
      {
        main_profit,
        ...(other_profit && { other_profit }),
        gross_profit: main_profit + other_profit
      },
      {
        where: {
          id,
          date: `${moment().format("YYYY-MM")}-${date}`
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
      attributes: ["id", "name", "salary", "status"]
    })
    if (getAllEmployee.length < 1) return response.res400(res, "Data karyawan tidak ada.");

    const responseAbsence = await Promise.all(
      getAllEmployee.map(async (employee_entity) => {
        const getEmployeeAbsence = await employee_absence.findOne({
          raw: true,
          where: {
            date: `${moment().format("YYYY-MM")}-${date}`,
            employee_id: employee_entity.employee_id
          }
        })
        return {
          ...employee_entity,
          is_present: (getEmployeeAbsence && getEmployeeAbsence.is_present == 1)
        }
      })
    );

    return response.res200(res, "000", "Sukses mendapatkan data absen karyawan.", responseAbsence)
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
  console.log(payload.absence_item)

  if (absenceItem.length < 1 && (allNotPresent === null || allNotPresent === undefined)) return response.res400(res, "Data belum terisi. Silahkan isi data absen dengan lengkap");

  const getCurrentStateAbsenceReport = await daily_report.findOne({
    raw: true,
    where: {
      date
    },
    attributes: ["id", "absence_detail_id"]
  })

  let absence_detail_id = getCurrentStateAbsenceReport.absence_detail_id || null;
  try {
    const dbTransaction = await db.transaction()
    if (!getCurrentStateAbsenceReport.absence_detail_id) {    // first time
      absence_detail_id = nanoid(10)
      await daily_report.update(
        {
          absence_detail_id
        },
        {
          where: {
            id: getCurrentStateAbsenceReport.id,
            date
          },
          transaction: dbTransaction
        }
      )

      // if (allNotPresent) {  // rare case
      for (const absence of absenceItem) {
        await employee_absence.create({
          transaction: dbTransaction,
          id: nanoid(20),
          employee_id: absence.employee_id,
          absence_detail_id,
          is_present: allNotPresent ? 0 : absence.is_present === true ? 1 : 0,
          date: `${moment().format("YYYY-MM")}-${date}`,
          created_date: new Date(),
          updated_date: new Date()
        })
      }
    } else {
      for (const absence of absenceItem) {
        const getCurrentAbsence = await employee_absence.findOne({
          raw: true,
          where: {
            employee_id: absence.employee_id,
            date: `${moment().format("YYYY-MM")}-${date}`,
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
                employee_id: absence.employee_id,
                date: `${moment().format("YYYY-MM")}-${date}`,
                absence_detail_id
              },
              transaction: dbTransaction
            }
          )
        } else {
          await employee_absence.create({
            transaction: dbTransaction,
            id: nanoid(20),
            employee_id: absence.employee_id,
            absence_detail_id,
            is_present: allNotPresent ? 0 : absence.is_present === true ? 1 : 0,
            date: `${moment().format("YYYY-MM")}-${date}`,
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
    return response.res400(res, "Gagal menambahkan / mengubah data absen.")
  }
}

exports.verifiedOmsetAndAbsence = async (req, res, next) => {
  const id = req.body.id
  const date = req.body.date
  if (!date) return response.res400(res, "date is required. please check the system.")

  try {
    await daily_report.update(
      {
        status: "verified"
      },
      {
        where: {
          id,
          date: `${moment().format("YYYY-MM")}-${date}`
        }
      }
    )
    return response.res200(res, "000", `Sukses memverifikasi data laporan harian ${moment().format("YYYY-MM")}-${date}. Silahkan melanjutkan untuk melihat rekap data & download file.`)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal verifikasi laporan harian. Silahkan hubungi admin.")
  }
}
