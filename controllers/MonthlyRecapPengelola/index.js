"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, monthly_recap, employee, employee_absence, rent, monthly_exact_expense } = require("../../components/database");
const { findCategoryKey, formatRupiah, sideHeader } = require("../../utils/utils")

// exports.getBagiHasil = async (req, res, next) => {
//   // const month = +req.query.month
//   const year = req.query.year
//   const month = "07"

//   if (!month || !year) return response.res400(res, "month & date is required.")
//   const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
//   let flagIsReportFullOneMonth = false

//   try {
//     const getDailyReport = await daily_report.findAll({
//       raw: true,
//       where: {
//         date: {
//           [Op.and]: [
//             { [Op.gte]: `${year}-${month}-01` },
//             { [Op.lt]: `${year}-${Number(month) + 1}-01` }
//           ]
//         }
//       }
//     })

//     if (getDailyReport.length === totalDayOfMonth) {
//       flagIsReportFullOneMonth = true;
//     }

//     const getShopExpense = await shop_expense_detail.findAll({
//       raw: true,
//       where: {
//         date: {
//           [Op.and]: [
//             { [Op.gte]: `${year}-${month}-01` },
//             { [Op.lt]: `${year}-${Number(month) + 1}-01` }
//           ]
//         }
//       }
//     })
//     // console.log({getShopExpense})
//     const getEmployees = await employee.findAll({
//       raw: true,
//       where: {
//         status: 1
//       }
//     })

//     const getEmployeeAbsence = await employee_absence.findAll({
//       raw: true,
//       where: {
//         date: {
//           [Op.and]: [
//             { [Op.gte]: `${year}-${month}-01` },
//             { [Op.lt]: `${year}-${Number(month) + 1}-01` }
//           ]
//         },
//         is_present: 1
//       }
//     })

//     const getRents = await rent.findAll({
//       raw: true,
//       where: {
//         status: 1
//       }
//     })

//     let totalAddExpense = 0;

//     // if (getAdditionExpense.length > 0) totalAddExpense = getAdditionExpense.reduce((accumulator, item) => {
//     //   return accumulator + item.nominal;
//     // }, 0);

//     const filteredLauk = getShopExpense.filter(lauk => lauk.category_id == "shop-001")
//     const filteredBumbuSayuran = getShopExpense.filter(lauk => lauk.category_id === "shop-002")
//     const filteredSembako = getShopExpense.filter(lauk => lauk.category_id === "shop-003")
//     const filteredOther = getShopExpense.filter(lauk => lauk.category_id === "shop-004")

//     const omset = getDailyReport.reduce((accumulator, item) => {
//       return accumulator + item.gross_profit;
//     }, 0);
//     console.log({omset})
//     const shopExpense = getDailyReport.reduce((accumulator, item) => {
//       return accumulator + item.shop_expense;
//     }, 0);
//     const totalLauk = filteredLauk.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const totalBumbuSayuran = filteredBumbuSayuran.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const totalSembako = filteredSembako.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const totalOther = filteredOther.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);

//     console.log({totalLauk, totalBumbuSayuran, totalSembako, totalOther})

//     const employeeMonth = []

//     for (const employee of getEmployees) {
//       const salaryPerDay = parseFloat(employee.salary / totalDayOfMonth).toFixed(2)
//       const filteredByEmployeeAbsence = getEmployeeAbsence.filter(employeeAbsence => employeeAbsence.employee_id === employee.id)
//       console.log("length:", filteredByEmployeeAbsence.length, salaryPerDay * (+filteredByEmployeeAbsence.length))
//       const objEmployee = {
//         id: employee.id,
//         name: employee.name,
//         salary: employee.salary,
//         salaryPerDay: salaryPerDay * (+filteredByEmployeeAbsence.length)
//       }
//       employeeMonth.push(objEmployee)
//     }

//     const rentMonth = []
//     for (const rent of getRents) {
//       console.log(rent.fee, totalDayOfMonth, "tes rent")
//       const rentPerDay = +parseFloat(+rent.fee / (+totalDayOfMonth)).toFixed(2)

//       const objRent = {
//         id: rent.id,
//         name: rent.name,
//         fee: rent.fee,
//         rentPerDay: rentPerDay * (+getDailyReport.length)
//       }
//       rentMonth.push(objRent)
//     }

//     console.log({employeeMonth, rentMonth})

//     const totalGaji = employeeMonth.reduce((accumulator, item) => {
//       return accumulator + item.salaryPerDay;
//     }, 0);
//     const totalSewa = rentMonth.reduce((accumulator, item) => {
//       return accumulator + item.rentPerDay;
//     }, 0);

//     const gajiDanSewa = +parseFloat((+totalGaji) + (+totalSewa)).toFixed(2)
//     const nettProfit = omset - shopExpense - gajiDanSewa

//     const bagiHasil = +parseFloat(nettProfit / 2).toFixed(2)
//     const transferKeInvestor = bagiHasil + totalSewa

//     const objResponse = {
//       omset,
//       expense: {
//         shopExpense,
//         laukPauk: totalLauk,
//         bumbuSayuran: totalBumbuSayuran,
//         sembakoMinuman: totalSembako,
//         lainLain: totalOther,
//       },
//       // ...(getAdditionExpense.length > 0 && {
//       //   additionExpense: {
//       //     additionExpenseTotal: totalAddExpense,
//       //     additionExpenseItems: getAdditionExpense
//       //   }
//       // }),
//       gajiSewa: {
//         gajiSewaTotal: gajiDanSewa,
//         gaji: employeeMonth,
//         sewa: rentMonth,
//         totalGaji,
//         totalSewa
//       },
//       nettProfit: nettProfit,
//       bagiHasil,
//       transferToInvestor: {
//         transferKeInvestor,
//         bagiHasil,
//         totalSewa
//       },
//       flagIsReportFullOneMonth,
//       startDate: moment(`${year}-${month}-01`).format("YYYY-MM-DD"),
//       endDate: getDailyReport.length > 0 ? moment(`${year}-${month}-${getDailyReport.length}`).format("YYYY-MM-DD") : undefined
//     }

//     return response.res200(res, "000", "Sukses mendapatkan data bulanan.", objResponse)
//   } catch (error) {
//     console.error(error)
//     return response.res400(res, "Error saat mendapatkan data bulanan.")
//   }
// }

exports.getBagiHasil = async (req, res, next) => {
  // const month = req.query.month
  const year = moment().format("YYYY")
  const month = "09"
  // month = kalo tanggal skrg <= tgl 2, berarti ambil bulan sblmnya. kalo lebih dr 2, ambil bulan berjalan
  console.log({month, year})

  if (!month || !year) return response.res400(res, "month & date is required.")
  const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
  let flagIsReportFullOneMonth = false

  try {
    const getDailyReport = await daily_report.findAll({
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
    console.log({getDailyReport})
    if (getDailyReport.length === totalDayOfMonth) {
      flagIsReportFullOneMonth = true;
    }

    const getShopExpense = await shop_expense_detail.findAll({
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

    const getEmployeeAbsence = await employee_absence.findAll({
      raw: true,
      where: {
        date: {
          [Op.and]: [
            { [Op.gte]: `${year}-${month}-01` },
            { [Op.lt]: `${year}-${Number(month) + 1}-01` }
          ]
        },
        is_present: 1
      }
    })

    let rents = null
    let employees = null

    const getMonthlyRecap = await monthly_recap.findOne({
      raw: true,
      where: {
        date: `${year}-${month}`,
        status: "verified"
      },
      attributes: ["id", "status"]
    })

    if (getMonthlyRecap) {
      rents =  await monthly_exact_expense.findAll({
        raw: true,
        where: {
          date: `${year}-${month}`,
          referrer_category: {
            [Op.like]: 'rent%'
          }
        },
        attributes: ["id", "name", "nominal"]
      })

      rents = rents.map((rentItem) => {
        return {
          ...rentItem,
          fee: rentItem.nominal
        }
      })

      employees =  await monthly_exact_expense.findAll({
        raw: true,
        where: {
          date: `${year}-${month}`,
          referrer_category: {
            [Op.like]: 'employee%'
          }
        },
        attributes: ["id", "name", "nominal"]
      })

      employees = employees.map((employeeItem) => {
        return {
          ...employeeItem,
          salary: employeeItem.nominal
        }
      })

    } else {
      rents = await rent.findAll({
        raw: true,
        where: {
          status: 1
        }
      })

      employees = await employee.findAll({
        raw: true,
        where: {
          status: 1
        }
      })
    }

    const getMonthlyAdditionalExpense = await monthly_exact_expense.findAll({
      raw: true,
      where: {
        date: `${year}-${month}`,
        referrer_category: "additional"
      },
      attributes: ["id", "name", "nominal"]
    })
    console.log({getMonthlyAdditionalExpense}, `${year}-${month}`)
    let totalAddExpense = 0;

    if (getMonthlyAdditionalExpense.length > 0) totalAddExpense = getMonthlyAdditionalExpense.reduce((accumulator, item) => {
      return accumulator + item.nominal;
    }, 0);

    const filteredLauk = getShopExpense.filter(lauk => lauk.category_id == "shop-001")
    const filteredBumbuSayuran = getShopExpense.filter(lauk => lauk.category_id === "shop-002")
    const filteredSembako = getShopExpense.filter(lauk => lauk.category_id === "shop-003")
    const filteredOther = getShopExpense.filter(lauk => lauk.category_id === "shop-004")

    const omset = getDailyReport.reduce((accumulator, item) => {
      return accumulator + item.gross_profit;
    }, 0);
    console.log({omset})
    const shopExpense = getDailyReport.reduce((accumulator, item) => {
      return accumulator + item.shop_expense;
    }, 0);
    const totalLauk = filteredLauk.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const totalBumbuSayuran = filteredBumbuSayuran.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const totalSembako = filteredSembako.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);
    const totalOther = filteredOther.reduce((accumulator, item) => {
      return accumulator + item.price;
    }, 0);

    console.log({totalLauk, totalBumbuSayuran, totalSembako, totalOther})

    const employeeMonth = []

    for (const employee of employees) {
      const salaryPerDay = parseFloat(employee.salary / totalDayOfMonth).toFixed(2)
      const filteredByEmployeeAbsence = getEmployeeAbsence.filter(employeeAbsence => employeeAbsence.employee_id === employee.id)
      // console.log("length:", filteredByEmployeeAbsence.length, salaryPerDay * (+filteredByEmployeeAbsence.length))
      const objEmployee = {
        id: employee.id,
        name: employee.name,
        salary: employee.salary,
        salaryPerDay: salaryPerDay * (+filteredByEmployeeAbsence.length)
      }
      employeeMonth.push(objEmployee)
    }

    const rentMonth = []
    for (const rent of rents) {
      console.log(rent.fee, totalDayOfMonth, "tes rent")
      const rentPerDay = +parseFloat(+rent.fee / (+totalDayOfMonth)).toFixed(2)

      const objRent = {
        id: rent.id,
        name: rent.name,
        fee: rent.fee,
        rentPerDay: rentPerDay * (+getDailyReport.length)
      }
      rentMonth.push(objRent)
    }

    console.log({employeeMonth, rentMonth})

    const totalGaji = employeeMonth.reduce((accumulator, item) => {
      return accumulator + item.salaryPerDay;
    }, 0);
    const totalSewa = rentMonth.reduce((accumulator, item) => {
      return accumulator + item.rentPerDay;
    }, 0);

    const gajiDanSewa = +parseFloat((+totalGaji) + (+totalSewa)).toFixed(2)
    const nettProfit = omset - shopExpense - gajiDanSewa - totalAddExpense

    const bagiHasil = +parseFloat(nettProfit / 2).toFixed(2)
    const transferKeInvestor = bagiHasil + totalSewa

    const objResponse = {
      omset,
      expense: {
        shopExpense,
        laukPauk: totalLauk,
        bumbuSayuran: totalBumbuSayuran,
        sembakoMinuman: totalSembako,
        lainLain: totalOther,
      },
      ...(getMonthlyAdditionalExpense.length > 0 ? {
          additionExpense: {
            additionExpenseTotal: totalAddExpense,
            additionExpenseItems: getMonthlyAdditionalExpense
          }
        } : {
          additionExpense: null
        }
      ),
      gajiSewa: {
        gajiSewaTotal: gajiDanSewa,
        gaji: employeeMonth,
        sewa: rentMonth,
        totalGaji,
        totalSewa
      },
      nettProfit: nettProfit,
      bagiHasil,
      transferToInvestor: {
        transferKeInvestor,
        bagiHasil,
        totalSewa
      },
      flagIsReportFullOneMonth,
      startDate: moment(`${year}-${month}-01`).format("YYYY-MM-DD"),
      endDate: getDailyReport.length > 0 ? moment(`${year}-${month}-${getDailyReport.length}`).format("YYYY-MM-DD") : undefined,
      isVerified: getMonthlyRecap && getMonthlyRecap.status === "verified"
    }

    return response.res200(res, "000", "Sukses mendapatkan data bulanan.", objResponse)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Error saat mendapatkan data bulanan.")
  }
}