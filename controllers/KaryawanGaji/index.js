"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const { db, employee } = require("../../components/database");

exports.getAllKaryawan = async (req, res, next) => {
  const getAllKaryawan = await employee.findAll({
    raw: true,
    where: {
      status: 1
    }
  });
  return response.res200(res, "000", "Sukses mendapatkan seluruh data karyawan.", getAllKaryawan);
};

exports.insertOrUpdateEmployee = async (req, res, next) => {
  /* 
    request example:
    employeeItems = [
      {
        id: xxx,
        name: blablabla,
        salary: xxx.xxx
      },
      {
        id: xxx,
        name: blablabla,
        salary: xxx.xxx
      }
    ]
  */
  const employeeItems = req.body.employeeItems;

  try {
    for (const employeeItem of employeeItems) {
      const getCurrentEmployeeItem = await employee.findOne({
        raw: true,
        where: {
          id: employeeItem.id
        }
      })

      if (getCurrentEmployeeItem) {
        await employee.update(
          {
            name: employeeItem.name,
            salary: employeeItem.salary,
            updated_date: new Date()
          },
          {
            where: {
              id: employeeItem.id
            }
          }
        )
      } else {
        await employee.create({
          id: `employee-${nanoid(6)}`,
          name: employeeItem.name,
          salary: employeeItem.salary,
          status: 1,
          created_date: new Date(),
          updated_date: new Date()
        })
      }
    }
    return response.res200(res, "000", "Sukses menambahkan / mengubah data karyawan.");
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal menambahkan / mengubah data karyawan. Silahkan hubungi admin.")
  }
};

exports.deleteKaryawan = async (req, res, next) => {
  const id = req.body.id;
  if (!id) return response.res400(res, "ID is required.")
  try {
    await employee.update(
      {
        status: 0,
        updated_date: new Date()
      },
      {
        where: {
          id
        }
      }
    )
    return response.res200(res, "000", "Sukses menghapus data karyawan.")
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal menghapus data karyawan. Silahkan hubungi admin.")
  }
}