"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const { db, monthly_exact_expense, monthly_recap, employee, rent } = require("../../components/database");

exports.insertOrUpdateAdditionalMonthlyExpense = async (req, res, next) => {
  const payload = {
    id: req.body.id,
    selected_month: req.body.selected_month,
    name: req.body.name,
    fee: req.body.fee
  }

  if (!payload.selected_month) return response.res400(res, "selected month is required")
  if (!payload.name) return response.res400(res, "name is required")
  if (!payload.fee) return response.res400(res, "fee is required")

  const dbTransaction = await db.transaction()
  const monthly_exact_expense_id = nanoid(10)
  try {
    const findMonthlyRecap = await monthly_recap.findOne({
      raw: true,
      where: {
        date: payload.selected_month
      }
    })

    if (payload.id && findMonthlyRecap && findMonthlyRecap.status !== "verified") {
      await monthly_exact_expense.update(
        {
          name: payload.name,
          nominal: payload.fee,
        },
        {
          where: {
            id: payload.id
          },
          transaction: dbTransaction
        }
      )

    } else {
      let monthly_recap_id = null

      if (findMonthlyRecap) {
        monthly_recap_id = findMonthlyRecap.id
      } else {
        monthly_recap_id = nanoid(20)

        await monthly_recap.create({
          transaction: dbTransaction,
          id: monthly_recap_id,
          status: "not_verified",
          date: payload.selected_month,
          created_date: new Date(),
          updated_date: new Date()
        })
      }

      await monthly_exact_expense.create({
        transaction: dbTransaction,
        id: monthly_exact_expense_id,
        monthly_recap_id,
        name: payload.name,
        nominal: payload.fee,
        referrer_category: "additional",
        date: payload.selected_month,
        created_date: new Date(),
        updated_date: new Date()
      })
    }
    await dbTransaction.commit()

    const getUpdatedData = await monthly_exact_expense.findOne({
      raw: true,
      where: {
        date: payload.selected_month
      },
      attributes: ["id", "name", "nominal"]
    })
    return response.res200(res, "000", "Sukses menambahkan / mengubah data tambahan bulanan.", getUpdatedData);
  } catch (error) {
    console.error(error);
    await dbTransaction.rollback()
    return response.res400(res, "Gagal menambahkan / mengubah data tambahan bulanan. Silahkan hubungi admin.")
  }
};

exports.deleteAdditionalMonthlyExpense = async (req, res, next) => {
  const id = req.body.id;
  if (!id) return response.res400(res, "ID is required.")
  try {
    await monthly_exact_expense.destroy({ where: { id } });

    return response.res200(res, "000", "Sukses menghapus data pengeluaran tambahan.")
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal menghapus data karyawan. Silahkan hubungi admin.")
  }
}

exports.verifyMonthlySpending = async (req, res, next) => {
  const selectedMonth = req.body.selected_month
  if (!selectedMonth) return response.res400(res, "selected_month is required.")

  const monthlyRecap = await monthly_recap.findOne({
    raw: true,
    where: {
      date: selectedMonth
    },
  })
  if (monthlyRecap && monthlyRecap.status === "verified") return response.res400(res, "Data bulanan sudah diverifikasi")

  const dbTransaction = await db.transaction()
  try {
    let monthlyRecapId = null
    if (!monthlyRecap) {
      monthlyRecapId = nanoid(20)
      await monthly_recap.create({
        transaction: dbTransaction,
        id: monthlyRecapId,
        status: "verified",
        date: selectedMonth,
        created_date: new Date(),
        updated_date: new Date()
      })
    } else {
      await monthly_recap.update(
        {
          status: "verified"
        },
        {
          where: {
            id: monthlyRecap.id,
            date: selectedMonth
          },
          transaction: dbTransaction
        }
      )
    }

    const getEmployees = await employee.findAll({
      raw: true,
      where: {
        status: 1
      }
    })
  
    const getRents = await rent.findAll({
      raw: true,
      where: {
        status: 1
      }
    })
  
    const employees = getEmployees.map((employeeItem) => {
      return {
        id: nanoid(10),
        monthly_recap_id: monthlyRecapId,
        name: employeeItem.name,
        nominal: employeeItem.salary,
        referrer_category: employeeItem.id,
        date: selectedMonth,
        created_date: new Date(),
        updated_date: new Date()
      }
    })
  
    const rents = getRents.map((rentItem) => {
      return {
        id: nanoid(10),
        monthly_recap_id: monthlyRecapId,
        name: rentItem.name,
        nominal: rentItem.fee,
        referrer_category: rentItem.id,
        date: selectedMonth,
        created_date: new Date(),
        updated_date: new Date()
      }
    })
  
    const bulkMonthlyExpense = [...employees, ...rents]
  
    await monthly_exact_expense.bulkCreate(bulkMonthlyExpense)
    await dbTransaction.commit()
    return response.res200(res, "000", `Sukses memverifikasi data bulanan tanggal ${selectedMonth}`)
  } catch (error) {
    console.error(error)
    await dbTransaction.rollback()
    return response.res400(res, "Gagal memverifikasi data bulanan. Mohon cek sistem ini.")
  }
}
