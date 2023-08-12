"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const { db, rent } = require("../../components/database");

exports.getAllBiayaSewa = async (req, res, next) => {
  const getAllRentFee = await rent.findAll({
    raw: true,
    where: {
      status: 1
    }
  });
  return response.res200(res, "000", "Sukses mendapatkan seluruh data biaya sewa.", getAllRentFee);
};

exports.insertOrUpdateBiayaSewa = async (req, res, next) => {
  /* 
    request example:
    biayaSewaItems = [
      {
        id: xxx,
        name: blablabla,
        fee: xxx.xxx
      },
      {
        id: xxx,
        name: blablabla,
        fee: xxx.xxx
      }
    ]
  */
  const biayaSewaItems = req.body.biayaSewaItems;

  try {
    for (const biayaItem of biayaSewaItems) {
      const getCurrentBiayaItem = await rent.findOne({
        raw: true,
        where: {
          id: biayaItem.id
        }
      })
      console.log({getCurrentBiayaItem}, {biayaItem})
      if (getCurrentBiayaItem) {
        await rent.update(
          {
            name: biayaItem.name,
            fee: biayaItem.fee,
            updated_date: new Date()
          },
          {
            where: {
              id: biayaItem.id
            }
          }
        )
      } else {
        await rent.create({
          id: `rent-${nanoid(6)}`,
          name: biayaItem.name,
          fee: +biayaItem.fee,
          status: 1,
          created_date: new Date(),
          updated_date: new Date()
        })
      }
    }
    return response.res200(res, "000", "Sukses menambahkan / mengubah data biaya sewa.");
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal menambahkan / mengubah data biaya sewa. Silahkan hubungi admin.")
  }
};

exports.deleteBiayaSewa = async (req, res, next) => {
  const id = req.body.id;
  const mustRent = ["rent-001", "rent-002"];
  if (mustRent.includes(id)) return response.res400(res, "Tidak dapat menghapus data biaya sewa yang wajib.")

  try {
    await rent.update(
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
    return response.res200(res, "000", "Sukses menghapus data biaya sewa.")
  } catch (error) {
    console.error(error);
    return response.res400(res, "Gagal menghapus data biaya sewa. Silahkan hubungi admin.")
  }
}