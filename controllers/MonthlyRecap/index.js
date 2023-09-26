"use strict";

const response = require("../../components/response")
const sequelize = require("sequelize");
const { Op } = sequelize;
const moment = require("moment");
const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")
const { validationEmail } = require("../../middlewares/validator")
const { db, category, daily_report, shop_expense_detail, monthly_recap, monthly_exact_expense, employee, employee_absence, rent } = require("../../components/database");
const { findCategoryKey, formatRupiah, sideHeader } = require("../../utils/utils")

// exports.generateMonthlyRecap = async (req, res, next) => {
//   if (!req.body.month) return response.res400(res, "month is required.")
//   if (!req.body.year) return response.res400(res, "year is required.")

//   const year = req.body.year;
//   const month = req.body.month;
//   const expenseItems = req.body.expense_items ? req.body.expense_items : null
//   const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
//   const monthlyRecapId = nanoid(10)

//   try {
//     const dailyReport = await daily_report.findAll({
//       raw: true,
//       where: {
//         date: {
//           [Op.and]: [
//             { [Op.gte]: `${year}-${month}-01` },
//             { [Op.lt]: `${year}-${Number(month) + 1}-01` }
//           ]
//         }
//       },
//       attributes: ["id", "gross_profit", "nett_profit", "shop_expense", "status", "date"]
//     })

//     const checkStatus = dailyReport.find(report => report.status !== "verified")
//     if (checkStatus) return response.res400(res, "Generate laporan laba rugi & laporan bulanan gagal. Silahkan lengkapi data harian terlebih dahulu.")
//     if (dailyReport.length !== 31 && dailyReport.length !== 30 && dailyReport.length !== 29 && dailyReport.length !== 28) {
//       return response.res400(res, "Generate laporan laba rugi & laporan bulanan gagal. Silahkan lengkapi data harian terlebih dahulu.")
//     }

//     const getRent = await rent.findAll({
//       raw: true,
//     })
//     if (getRent.length < 1) return response.res400(res, "Gagal mendapatkan biaya sewa.")

//     const shopExpenseDetail = await shop_expense_detail.findAll({
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

//     if (shopExpenseDetail.length < 1) return response.res400(res, "Gagal mendapatkan data pengeluaran belanja.")

//     const laukPauk = shopExpenseDetail.filter(item => item.category_id === "shop-001")
//     const bumbuSayuran = shopExpenseDetail.filter(item => item.category_id === "shop-002")
//     const sembakoMinuman = shopExpenseDetail.filter(item => item.category_id === "shop-003")
//     const lainLain = shopExpenseDetail.filter(item => item.category_id === "shop-004")

//     const employeeInfo = await employee.findAll({
//       raw: true,
//       where: {
//         status: 1
//       }
//     })
//     let totalSalary = 0
//     if (employeeInfo.length > 0) {
//       for (const employee of employeeInfo) {
//         const salaryPerDay = employee.salary / totalDayOfMonth;
//         const employeeAbsence = await employee_absence.findAll({
//           raw: true,
//           where: {
//             date: {
//               [Op.and]: [
//                 { [Op.gte]: `${year}-${month}-01` },
//                 { [Op.lt]: `${year}-${Number(month) + 1}-01` }
//               ]
//             },
//             employee_id: employee.id
//           }
//         })
//         const totalSalary = salaryPerDay * employeeAbsence.length

//         for (const absence of employeeAbsence) {
//           const findDayReport = await dailyReport.findOne({
//             raw: true,
//             where: {
//               date: absence.date
//             },
//             attributes: ["id", "employees_salary_expense"]
//           })

//           const sumSalaryInDay = findDayReport.employees_salary_expense ? +findDayReport.employees_salary_expense + totalSalary : totalSalary
//           totalSalary = totalSalary + sumSalaryInDay

//           await dailyReport.update(
//             {
//               employees_salary_expense: sumSalaryInDay
//             },
//             {
//               where: {
//                 date: absence.date
//               }
//             }
//           )
//         }
//       }
//     }

    
//     const gross_profit = dailyReport.reduce((accumulator, item) => {
//       return accumulator + item.gross_profit;
//     }, 0);
//     let shop_expense = dailyReport.reduce((accumulator, item) => {
//       return accumulator + item.shop_expense;
//     }, 0);
//     let nett_profit = dailyReport.reduce((accumulator, item) => {
//       return accumulator + item.nett_profit;
//     }, 0);
//     const total_sewa = getRent.reduce((accumulator, item) => {
//       return accumulator + item.fee;
//     }, 0);

//     const total_lauk_pauk = laukPauk.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const total_bumbu_sayuran = bumbuSayuran.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const total_sembako_minuman = sembakoMinuman.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const total_others = lainLain.reduce((accumulator, item) => {
//       return accumulator + item.price;
//     }, 0);
//     const total_gaji = totalSalary

//     const dbTransaction = await db.transaction()

//     try {
//       if (expenseItems) {
//         const additionExpense = expenseItems.reduce((accumulator, item) => {
//           return accumulator + item.fee;
//         }, 0);
//         const arrayExpense = expenseItems.map((item) => {
//           return {
//             id: nanoid(5),
//             monthly_recap_id: monthlyRecapId,
//             name: item.name,
//             nominal: item.nominal,
//             date: item.date,
//             created_date: new Date(),
//             updated_date: new Date()
//           }
//         })
//         await monthly_expense_addition.bulkCreate(arrayExpense, { transaction: dbTransaction })
  
//         shop_expense = shop_expense + additionExpense
//         nett_profit = nett_profit - additionExpense
//       }
  
//       await monthly_recap.create({
//         transaction: dbTransaction,
//         id: nanoid(10),
//         gross_profit,
//         shop_expense,
//         total_lauk_pauk,
//         total_bumbu_sayuran,
//         total_sembako_minuman,
//         total_others,
//         total_gaji,
//         total_sewa,
//         nett_profit,
//         status: "verified",
//         date: `${year}-${month}-${totalDayOfMonth}`,
//         created_date: new Date(),
//         updated_date: new Date()
//       })
//       await dbTransaction.commit()
//     } catch (error) {
//       console.error(error)
//       await dbTransaction.rollback()
//     }
//     return response.res200(res, "000", "Sukses generate data bulanan.")
//   } catch (error) {
//     console.error(error)
//     return response.res400(res, "Error creating monthly recap.")
//   }
// }

exports.getBagiHasil = async (req, res, next) => {
  const month = req.query.month
  const year = +req.query.year
  // const month = "07"
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

exports.getLaporanBulanan = async (req, res, next) => {
  const month = req.query.month
  const year = req.query.year
  if (!year || !month) return response.res400(res, "month & year are required.")
  const totalDayOfMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();

  // CONST VALUE ID, CHECK IN DB
  const idBeras = "sembako-minuman-001"
  const idGas = "lain-lain-003"
  const idAirIsiUlang = "lain-lain-008"
  const idListrik = "lain-lain-001"
  const idPulsa = "lain-lain-011"

  const getAllEmployee = await employee.findAll({
    raw: true,
    where: {
      status: 1
    }
  })

  const newAllEmployee = getAllEmployee.map((employee) => {
    return {
      ...employee,
      salaryPerDay: (+employee.salary) / (+totalDayOfMonth)
    }
  })

  const getAllRent = await rent.findAll({
    raw: true,
    where: {
      status: 1
    }
  })

  const totalRentInMonth = getAllRent.reduce((accumulator, item) => {
    return accumulator + item.fee;
  }, 0);
  const totalRentInDay = totalRentInMonth / (+totalDayOfMonth)

  let dataArray = []
  try {
    const objTanggal = { day0: "Tanggal" }
    const objBahanBakuTitle = { day0: "Bahan Baku" }
    const objSayuran = {
      day0: "Sayuran"
    }
    const objLauk = {
      day0: "Lauk"
    }
    const objSembako = { day0: "Sembako" }
    const objBeras = { day0: "Beras" }
    const objBahanBaku = { day0: "Total Bahan Baku" }
    const objGas = { day0: "Gas" }
    const objAirIsiUlang = { day0: "Air Isi Ulang" }
    const objListrik = { day0: "Listrik" }
    const objPulsa = { day0: "Pulsa" }
    const objLainLain = { day0: "Lain - Lain" }
    const objDiluarBahanBaku = { day0: "Total Diluar Bahan Baku" }   // tobeconfirmed ini pengeluaran yg diisi tiap bulan terus dibagi hari bulan atau bukan
    const objPengeluaran = { day0: "Total Pengeluaran" }
    const objPengeluaranCummulative = { day0: "Peng Cummulative" }
    const objSalesRevenue = { day0: "Sales Revenue" }
    const objSalesCummulative = { day0: "Sales Cummulative" }
    const objPencadangan = { day0: "Pencadangan" }
    const objHonorKaryawan = { day0: "Honor Karyawan" }
    const objBiayaSewa = { day0: "Biaya Sewa" }
    const objPencadanganPerBulan = { day0: "Pencadangan/bulan" }
    const objCadanganAwalCum = { day0: "Cadangan Awal (Kumulatif)" }
    const objCadanganAkhirCum = { day0: "Cadangan Akhir (Kumulatif)" }
    const objNetProfitCum = { day0: "Net Profit Cummulative" }
    const objViewInvestor = { day0: "View Investor" }
    const objCashInInvestor = { day0: "Cash In" }
    const objDariCustomerInvestor = { day0: "Dari Customer" }
    const objCashOutInvestor = { day0: "Cash Out" }
    const objPengeluaranInvestor = { day0: "Pengeluaran" }
    const objNetCashInvestor = { day0: "Net Cash" }
    const objKasAwalInvestor = { day0: "Kas Awal" }
    const objKasAkhirInvestor = { day0: "Kas Akhir" }
    const objViewPengelola = { day0: "View Pengelola" }
    const objCashInPengelola = { day0: "Cash In" }
    const objDariCustomerPengelola = { day0: "Dari Customer" }
    const objCashOutPengelola = { day0: "Cash Out" }
    const objPembelianPengelola = { day0: "Pembelian" }
    const objPencadanganPengelola = { day0: "Pencadangan" }
    const objNetCashPengelola = { day0: "Net Cash" }
    const objKasAwalPengelola = { day0: "Kas Awal" }
    const objKasAkhirPengelola = { day0: "Kas Akhir" }

    const findDailyReportAllDay = await daily_report.findAll({
      raw: true,
      where: {
        date: {
          [Op.and]: [
            { [Op.gte]: `${year}-${month}-01` },
            { [Op.lt]: `${year}-${Number(month) + 1}-01` }
          ]
        },
        status: "verified"
      },
      order: [['date', 'ASC']]
    })
    console.log({findDailyReportAllDay})

    for (let i = 1; i <= findDailyReportAllDay.length; i++) {
      const dateFormat = i < 10 ? `0${i}` : i
      const monthFormat = month < 10 ? `${month}` : i
      console.log(`${dateFormat}-${monthFormat}-${year}`)

      objTanggal[`day${i}`] = moment(`${year}-${monthFormat}-${dateFormat}`).format("DD/MM/YYYY")
      objBahanBakuTitle[`day${i}`] = ""

      const findDailyReportInDay = await daily_report.findOne({
        raw: true,
        where: {
          date: `${year}-${monthFormat}-${dateFormat}`
        }
      })
      console.log("TES")
      const findShopExpenseInDay = await shop_expense_detail.findAll({
        raw: true,
        where: {
          date: `${year}-${monthFormat}-${dateFormat}`
        }
      })
      const findEmployeeAbsenceInDay = await employee_absence.findAll({
        raw: true,
        where: {
          date: `${year}-${monthFormat}-${dateFormat}`
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
      const onlyBeras = findShopExpenseInDay.find(sembako => sembako.daily_shop_item_id === idBeras)

      const onlyOthers = findShopExpenseInDay.filter(lauk => lauk.category_id === "shop-004")
      const total_others = onlyOthers.reduce((accumulator, item) => {
        return accumulator + item.price;
      }, 0);
      const onlyGas = findShopExpenseInDay.find(sembako => sembako.daily_shop_item_id === idGas)
      const onlyAirIsiUlang = findShopExpenseInDay.find(sembako => sembako.daily_shop_item_id === idAirIsiUlang)
      const onlyListrik = findShopExpenseInDay.find(sembako => sembako.daily_shop_item_id === idListrik)
      const onlyPulsa = findShopExpenseInDay.find(sembako => sembako.daily_shop_item_id === idPulsa)


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
      objSembako[`day${i}`] = total_sembako_minuman - (onlyBeras ? onlyBeras.price : 0)  // exclude beras
      objBeras[`day${i}`] = onlyBeras ? onlyBeras.price : 0
      objBahanBaku[`day${i}`] = total_lauk_pauk + total_bumbu_sayuran + total_sembako_minuman

      objGas[`day${i}`] = onlyGas ? onlyGas.price : 0
      objAirIsiUlang[`day${i}`] = onlyAirIsiUlang ? onlyAirIsiUlang.price : 0
      objListrik[`day${i}`] = onlyListrik ? onlyListrik.price : 0
      objPulsa[`day${i}`] = onlyPulsa ? onlyPulsa.price : 0
      objLainLain[`day${i}`] = +total_others - ((onlyGas ? +onlyGas.price : 0) + (onlyAirIsiUlang ? +onlyAirIsiUlang.price : 0) + (onlyListrik ? +onlyListrik.price : 0) + (onlyPulsa ? onlyPulsa.price : 0)) // exclude some of that
      objDiluarBahanBaku[`day${i}`] = total_others

      objPengeluaran[`day${i}`] = findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional pengeluaran

      objSalesRevenue[`day${i}`] = findDailyReportInDay.gross_profit

      objPencadangan[`day${i}`] = " "

      let totalSalaryInDay = 0
      for (const employeePresent of findEmployeeAbsenceInDay) {
        if (employeePresent.is_present == 1) {
          const findEmployee = newAllEmployee.find(employee_entity => employee_entity.id === employeePresent.employee_id)
          totalSalaryInDay += findEmployee.salaryPerDay
        }
      }
      objHonorKaryawan[`day${i}`] = totalSalaryInDay
      objBiayaSewa[`day${i}`] = totalRentInDay

      objPencadanganPerBulan[`day${i}`] = totalSalaryInDay + totalRentInDay
      objCadanganAwalCum[`day${i}`] = i === 1 ? "-" : objCadanganAkhirCum[`day${i-1}`]
      objCadanganAkhirCum[`day${i}`] = totalSalaryInDay + totalRentInDay + (i === 1 ? 0 : objCadanganAkhirCum[`day${i-1}`])

      if (i === 1) {
        objPengeluaranCummulative[`day${i}`] = objPengeluaran[`day${i}`]
        objSalesCummulative[`day${i}`] = objSalesRevenue[`day${i}`]
        objNetProfitCum[`day${i}`] = findDailyReportInDay.gross_profit - (totalSalaryInDay + totalRentInDay) - findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional pengeluaran
        objKasAwalInvestor[`day${i}`] = "-" 
        objKasAkhirInvestor[`day${i}`] = findDailyReportInDay.gross_profit - findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional
        objKasAwalPengelola[`day${i}`] = "-"
        objKasAkhirPengelola[`day${i}`] = findDailyReportInDay.gross_profit - ((totalSalaryInDay + totalRentInDay) + findDailyReportInDay.shop_expense) // ada kemungkinan ditambah additional pengeluaran
      } else {
        objPengeluaranCummulative[`day${i}`] =  objPengeluaranCummulative[`day${i-1}`] + objPengeluaran[`day${i}`]
        objSalesCummulative[`day${i}`] = objSalesCummulative[`day${i-1}`] + objSalesRevenue[`day${i}`]
        objNetProfitCum[`day${i}`] = objNetProfitCum[`day${i}`] + (findDailyReportInDay.gross_profit - (totalSalaryInDay + totalRentInDay) - findDailyReportInDay.shop_expense) // ada kemungkinan ditambah additional pengeluaran
        objKasAwalInvestor[`day${i}`] = objKasAkhirInvestor[`day${i - 1}`]
        objKasAkhirInvestor[`day${i}`] = objKasAkhirInvestor[`day${i}`] + (findDailyReportInDay.gross_profit - findDailyReportInDay.shop_expense) // ada kemungkinan ditambah additional 
        objKasAwalPengelola[`day${i}`] = objKasAkhirPengelola[`day${i - 1}`]
        objKasAkhirPengelola[`day${i}`] = objKasAkhirPengelola[`day${i}`] + findDailyReportInDay.gross_profit - ((totalSalaryInDay + totalRentInDay) + findDailyReportInDay.shop_expense) // ada kemungkinan ditambah additional pengeluaran
      }

      if (i !== totalDayOfMonth) {
        // objPengeluaranCummulative[`day${i + 1}`] = objPengeluaran[`day${i}`]
        // objSalesCummulative[`day${i + 1}`] = objSalesRevenue[`day${i}`]
        objNetProfitCum[`day${i + 1}`] = objNetProfitCum[`day${i}`]
        objKasAkhirInvestor[`day${i + 1}`] = objKasAkhirInvestor[`day${i}`]
        objKasAkhirPengelola[`day${i + 1}`] = objKasAkhirPengelola[`day${i}`]
      }

      objViewInvestor[`day${i}`] = " "
      objCashInInvestor[`day${i}`] = " "
      objDariCustomerInvestor[`day${i}`] = findDailyReportInDay.gross_profit
      objCashOutInvestor[`day${i}`] = " "
      objPengeluaranInvestor[`day${i}`] = findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional pengeluaran
      objNetCashInvestor[`day${i}`] = findDailyReportInDay.gross_profit - findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional pengeluaran
      
      objViewPengelola[`day${i}`] = " "
      objCashInPengelola[`day${i}`] = " "
      objDariCustomerPengelola[`day${i}`] = findDailyReportInDay.gross_profit
      objCashOutPengelola[`day${i}`] = " "
      objPembelianPengelola[`day${i}`] = findDailyReportInDay.shop_expense // ada kemungkinan ditambah additional pengeluaran
      objPencadanganPengelola[`day${i}`] = totalSalaryInDay + totalRentInDay
      objNetCashPengelola[`day${i}`] = findDailyReportInDay.gross_profit - ((totalSalaryInDay + totalRentInDay) + findDailyReportInDay.shop_expense) // ada kemungkinan ditambah additional pengeluaran
      // objKasAwalPengelola[`day${i}`] = 
      // objKasAkhirPengelola[`day${i}`] = 
    }

    dataArray = [
      { ...objTanggal },
      { ...objBahanBakuTitle },
      { ...objSayuran },
      { ...objLauk },
      { ...objSembako },
      { ...objBeras },
      { ...objBahanBaku },
      { ...objGas },
      { ...objAirIsiUlang },
      { ...objListrik },
      { ...objPulsa },
      { ...objLainLain },
      { ...objDiluarBahanBaku },
      { ...objPengeluaran },
      { ...objPengeluaranCummulative },
      { ...objSalesRevenue },
      { ...objSalesCummulative },
      { ...objPencadangan },
      { ...objHonorKaryawan },
      { ...objBiayaSewa },
      { ...objPencadanganPerBulan },
      { ...objCadanganAwalCum },
      { ...objCadanganAkhirCum },
      { ...objNetProfitCum },
      { ...objViewInvestor },
      { ...objCashInInvestor },
      { ...objDariCustomerInvestor },
      { ...objCashOutInvestor },
      { ...objPengeluaranInvestor },
      { ...objNetCashInvestor },
      { ...objKasAwalInvestor },
      { ...objKasAkhirInvestor },
      { ...objViewPengelola },
      { ...objCashInPengelola },
      { ...objDariCustomerPengelola },
      { ...objCashOutPengelola },
      { ...objPembelianPengelola },
      { ...objPencadanganPengelola },
      { ...objNetCashPengelola },
      { ...objKasAwalPengelola },
      { ...objKasAkhirPengelola }
    ]

    return response.res200(res, "000", "Sukses mendapatkan data perbulan", dataArray)
  } catch (error) {
    console.error(error)
    return response.res400(res, "Gagal mendapatkan data perbulan")
  }
}