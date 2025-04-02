const tr_taxExemptionReasonCodes = require('../../constants/tr_taxExemptionReasonCodes.json')
const tr_taxTypeCodes = require('../../constants/tr_taxTypeCodes.json')
const tr_withholdingTaxTypeCodes = require('../../constants/tr_withholdingTaxTypeCodes.json')
module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    const mevzuat = 'tr'  // TODO: calisilan veritabini hangi ulke mevzuatina gore ayarlanmis ise..
    switch (req.method.toUpperCase()) {
      case 'GET':
        if (mevzuat == 'tr') {
          switch (req.params.param1) {
            case 'taxExemptionReasonCodes':

              if (req.query.output == 'json') {
                resolve(tr_taxExemptionReasonCodes)
              } else {
                resolve(Object.keys(tr_taxExemptionReasonCodes).map(key => ({ _id: key, name: tr_taxExemptionReasonCodes[key] })))
              }
              break
            case 'taxTypeCodes':
              if (req.query.output == 'json') {
                resolve(tr_taxTypeCodes)
              } else {
                resolve(Object.keys(tr_taxTypeCodes).map(key => ({ _id: key, name: tr_taxTypeCodes[key] })))
              }

              break
            case 'withholdingTaxTypeCodes':

              if (req.query.output == 'json') {
                resolve(tr_withholdingTaxTypeCodes)
              } else {
                resolve(Object.keys(tr_withholdingTaxTypeCodes).map(key => ({ _id: key, name: tr_withholdingTaxTypeCodes[key].text, rate: tr_withholdingTaxTypeCodes[key].rate })))
              }
              break
            default:
              reject('constants not found')
              break
          }
        } else {
          resolve({})
        }

        break

      default:
        restError.method(req, reject)
        break
    }
  })

