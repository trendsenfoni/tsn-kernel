const { party, taxTotal, withholdingTaxTotal } = require('./partyHelper')
const collectionName = path.basename(__filename, '.collection.js')
const { v4 } = require('uuid')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			firm: { type: ObjectId, ref: 'firms', default: null, index: true },
			ioType: { type: Number, required: true, index: true },
			profileId: {
				type: String, required: true, index: true,
				enum: ['TEMELFATURA', 'TICARIFATURA', 'EARSIVFATURA', 'IHRACAT', 'YOLCUBERABERFATURA']
			},
			invoiceTypeCode: {
				type: String, required: true, index: true,
				enum: ['SATIS', 'IADE', 'TEVKIFAT', 'ISTISNA', 'OZELMATRAH', 'IHRACKAYITLI']
			},
			ID: { type: String, default: '', index: true },
			uuid: { type: String, default: v4(), index: true },
			issueDate: { type: String, index: true, min: 10, max: 10, default: new Date().toISOString().substring(0, 10) },
			issueTime: { type: String, index: true, min: 8, max: 22, default: new Date().toISOString().substring(11).replace('Z', '+00:00') },
			lineCountNumeric: { type: Number, default: 0 },
			currency: { type: String, enum: ['USD', 'EUR', 'TRY', 'GBP', 'RUB', 'AZN', 'AED'], default: 'USD' },

			exchangeRate: {
				sourceCurrencyCode: { type: String, default: 'TRY', index: true },
				targetCurrencyCode: { type: String, default: 'TRY', index: true },
				calculationRate: { type: Number, default: 1 },
				date: { type: String, default: '' },
			},
			taxTotal: taxTotal(),
			withholdingTaxTotal: withholdingTaxTotal(),
			legalMonetaryTotal: {
				lineExtensionAmount: { type: Number, default: 0 },
				taxExclusiveAmount: { type: Number, default: 0 },
				taxInclusiveAmount: { type: Number, default: 0 },
				allowanceTotalAmount: { type: Number, default: 0 },
				chargeTotalAmount: { type: Number, default: 0 },
				payableAmount: { type: Number, default: 0 },
			},
			accountingSupplierParty: party(),
			accountingCustomerParty: party(),
			note: [{ type: String, default: '' }],
			draft: { type: Boolean, default: false, index: true },
		},
		{ versionKey: false, timestamps: true }
	)

	schema.pre('save', (next) => next())
	schema.pre('remove', (next) => next())
	schema.pre('remove', true, (next, done) => next())
	schema.on('init', (model) => { })
	schema.plugin(mongoosePaginate)


	let model = dbModel.conn.model(collectionName, schema, collectionName)

	model.removeOne = (session, filter) => sendToTrash(dbModel, collectionName, session, filter)
	return model
}
