const taxExemptionReasonCodes = require('../../constants/taxExemptionReasonCodes.json')
const taxTypeCodes = require('../../constants/taxTypeCodes.json')
const withholdingTaxTypeCodes = require('../../constants/withholdingTaxTypeCodes.json')
module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    const mevzuat = 'tr'  // TODO: calisilan veritabini hangi ulke mevzuatina gore ayarlanmis ise..
    switch (req.method.toUpperCase()) {
      case 'GET':
        if (mevzuat == 'tr') {
          switch (req.params.param1) {
            case 'taxExemptionReasonCodes':

              if (req.query.output == 'json') {
                resolve(taxExemptionReasonCodes)
              } else {
                resolve(Object.keys(taxExemptionReasonCodes).map(key => ({ _id: key, name: taxExemptionReasonCodes[key] })))
              }
              break
            case 'taxTypeCodes':
              if (req.query.output == 'json') {
                resolve(taxTypeCodes)
              } else {
                resolve(Object.keys(taxTypeCodes).map(key => ({ _id: key, name: taxTypeCodes[key] })))
              }

              break
            case 'withholdingTaxTypeCodes':

              if (req.query.output == 'json') {
                resolve(withholdingTaxTypeCodes)
              } else {
                resolve(Object.keys(withholdingTaxTypeCodes).map(key => ({ _id: key, name: withholdingTaxTypeCodes[key].text, rate: withholdingTaxTypeCodes[key].rate })))
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

