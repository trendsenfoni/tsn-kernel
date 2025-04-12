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
      let taxTotal = { taxAmount: 0, taxSubtotal: [] }
      let withholdingTaxTotal = []
      let satirTaxTotal = false
      let invoiceDoc = await dbModel.invoices.findOne({ _id: invoiceId })
      if (!invoiceDoc) return reject('invoice not found (update invoice)')

      let lineIndex = 0
      while (lineIndex < lines.length) {
        const line = lines[lineIndex]
        lineExtensionAmount += line.lineExtensionAmount
        taxExclusiveAmount += line.lineExtensionAmount
        if (line.taxTotal && line.taxTotal.taxAmount > 0 && line.taxTotal.taxSubtotal.length > 0) {
          satirTaxTotal = true
          taxTotal.taxAmount += line.taxTotal.taxAmount
          let stIndex = 0
          while (stIndex < line.taxTotal.taxSubtotal.length) {
            const k = line.taxTotal.taxSubtotal[stIndex]
            if (k.taxCategory && k.taxCategory.taxScheme && k.taxCategory.taxScheme.taxTypeCode) {
              let bulundu = false
              taxTotal.taxSubtotal.forEach(l => {
                if (l.taxCategory && l.taxCategory.taxScheme && l.taxCategory.taxScheme.taxTypeCode == k.taxCategory.taxScheme.taxTypeCode && l.percent == k.percent) {
                  bulundu = true
                  l.taxAmount += k.taxAmount
                }
              })
              if (!bulundu) {
                taxTotal.taxSubtotal.push(k)
              }
            }
            stIndex++
          }

        }
        lineIndex++
      }
      taxTotal.taxAmount = Math.round(100 * taxTotal.taxAmount) / 100
      lineExtensionAmount = Math.round(100 * lineExtensionAmount) / 100
      taxExclusiveAmount = Math.round(100 * taxExclusiveAmount) / 100
      invoiceDoc.legalMonetaryTotal.lineExtensionAmount = lineExtensionAmount
      invoiceDoc.legalMonetaryTotal.taxExclusiveAmount = taxExclusiveAmount
      if (satirTaxTotal) {
        invoiceDoc.taxTotal = taxTotal
      }

      invoiceDoc.legalMonetaryTotal.taxInclusiveAmount = taxExclusiveAmount + taxTotal.taxAmount

      invoiceDoc.save()
        .then(resolve)
        .catch(reject)


    } catch (err) {
      reject(err)
    }

  })
}