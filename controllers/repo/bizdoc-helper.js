const { taxTotal, withholdingTaxTotal } = require('../../db/collections/repo/partyHelper')

exports.updateOrder = function (dbModel, orderId) {
  return new Promise((resolve, reject) => {
    let aggregate = [
      { $match: { order: orderId } },
      {
        $group: {
          _id: '$order',
          lineCount: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          total: { $sum: '$total' },
          taxAmount: { $sum: '$taxAmount' },
          withHoldingTaxAmount: { $sum: '$withHoldingTaxAmount' },
          taxInclusiveTotal: { $sum: '$taxInclusiveTotal' },
        }
      }
    ]
    dbModel.orderLines
      .aggregate(aggregate)
      .then(async result => {
        if (result.length > 0) {
          await dbModel.orders.updateOne({ _id: result[0]._id }, {
            $set: {
              lineCount: result[0].lineCount,
              total: Math.round(100 * result[0].total) / 100,
              quantity: result[0].quantity,
              taxAmount: Math.round(100 * result[0].taxAmount) / 100,
              withHoldingTaxAmount: Math.round(100 * result[0].withHoldingTaxAmount) / 100,
              taxInclusiveTotal: Math.round(100 * (result[0].total + result[0].taxAmount - result[0].withHoldingTaxAmount)) / 100,
            }
          })
          console.log(result[0])
        }
        resolve()
      })
      .catch(reject)
  })
}

exports.updateInvoice = function (dbModel, invoiceId) {
  return new Promise(async (resolve, reject) => {
    try {
      const lines = await dbModel.invoiceLines.find({ invoice: invoiceId })
      let lineExtensionAmount = 0
      let taxExclusiveAmount = 0
      let taxInclusiveAmount = 0
      let allowanceTotalAmount = 0
      let chargeTotalAmount = 0
      let payableAmount = 0
      // let taxTotal = taxTotal()
      // let withholdingTaxTotal = withholdingTaxTotal()
      let invoiceDoc = await dbModel.invoices.findOne({ _id: invoiceId })
      if (!invoiceDoc) return reject('invoice not found (update invoice)')

      lines.forEach(line => {
        lineExtensionAmount += line.lineExtensionAmount
        taxExclusiveAmount += line.lineExtensionAmount
        // if (line.taxTotal && (line.taxAmount || 0) > 0) {
        //   line.taxTotal.taxSubTotal.forEach(e => {
        //     taxTotal.taxAmount += e.taxAmount
        //     const fIndex = taxTotal.taxSubTotal.findIndex(k => k.percent == e.percent && k.taxCategory?.taxScheme?.taxTypeCode == e.taxCategory?.taxScheme?.taxTypeCode)  
        //     if (fIndex > -1) {

        //     } else {

        //       taxTotal.taxSubTotal.push(e)
        //     }
        //   })

        // }
      })
      invoiceDoc.legalMonetaryTotal.lineExtensionAmount = lineExtensionAmount
      invoiceDoc.legalMonetaryTotal.taxExclusiveAmount = taxExclusiveAmount
      invoiceDoc.legalMonetaryTotal.taxInclusiveAmount = taxExclusiveAmount
      invoiceDoc.save()
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}