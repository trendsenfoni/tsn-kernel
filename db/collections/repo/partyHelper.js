exports.party = () => {
  return {
    websiteURI: { type: String, default: '' },
    partyName: { type: String, default: '', index: true },
    person: {
      firstName: { type: String, default: '', index: true },
      middleName: { type: String, default: '', index: true },
      familyName: { type: String, default: '', index: true },
      nationalityId: { type: String, default: '', index: true },
      title: { type: String, default: '' },
      nameSuffix: { type: String, default: '' },
      financialAccount: { type: String, default: '' },
      identityDocumentReference: {}
    },
    partyIdentification: [{
      schemeID: { type: String, default: '', index: true },
      ID: { type: String, default: '', index: true }
    }],
    partyTaxScheme: {
      taxScheme: {
        name: { type: String, default: '', index: true }
      }
    },
    postalAddress: {
      room: { type: String, default: '' },
      streetName: { type: String, default: '', index: true },
      blockName: { type: String, default: '' },
      buildingName: { type: String, default: '' },
      buildingNumber: { type: String, default: '' },
      citySubdivisionName: { type: String, default: '' },
      cityName: { type: String, default: '', index: true },
      postalZone: { type: String, default: '' },
      postbox: { type: String, default: '' },
      region: { type: String, default: '' },
      district: { type: String, default: '', index: true },
      country: {
        identificationCode: { type: String, default: '' },
        name: { type: String, default: '' }
      }
    },
    contact: {
      telephone: { type: String, default: '', index: true },
      telefax: { type: String, default: '', index: true },
      electronicMail: { type: String, default: '', index: true },
    }
  }
}

exports.taxTotal = () => {
  return {
    taxAmount: { type: Number, default: 0 },
    taxSubtotal: [{
      taxableAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      calculationSequenceNumeric: { type: Number, default: 1 },
      percent: { type: Number, default: 0 },
      taxCategory: {
        taxExemptionReasonCode: { type: String, default: '' },
        taxExemptionReason: { type: String, default: '' },
        taxScheme: {
          name: { type: String, default: '' },
          taxTypeCode: { type: String, default: '' }
        }
      }
    }]
  }
}
exports.withholdingTaxTotal = () => {
  return [{
    taxAmount: { type: Number, default: 0 },
    taxSubtotal: [{
      taxableAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      calculationSequenceNumeric: { type: Number, default: 1 },
      percent: { type: Number, default: 0 },
      taxCategory: {
        taxExemptionReasonCode: { type: String, default: '' },
        taxExemptionReason: { type: String, default: '' },
        taxScheme: {
          name: { type: String, default: '' },
          taxTypeCode: { type: String, default: '' }
        }
      }
    }]
  }]
}