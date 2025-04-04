const { taxTotal, withholdingTaxTotal } = require('./partyHelper')
const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			invoice: { type: ObjectId, ref: 'invoices', required: true, index: true },
			ioType: { type: Number, required: true, index: true },
			issueDate: { type: String, index: true, min: 10, max: 10, default: new Date().toISOString().substring(0, 10) },
			issueTime: { type: String, index: true, min: 8, max: 22, default: new Date().toISOString().substring(11).replace('Z', '+00:00') },
			ID: { type: String, default: '' },
			item: { type: ObjectId, ref: 'items', index: true },
			description: { type: String, default: '' },
			invoicedQuantity: { type: Number, default: 0 },
			invoicedQuantity2: { type: Number, default: 0 },
			invoicedQuantity3: { type: Number, default: 0 },
			price: { type: Number, default: 0 },
			lineExtensionAmount: { type: Number, default: 0 },
			unitCode: { type: String, default: '' },
			currency: { type: String, default: '' },
			taxTotal: taxTotal(),
			withholdingTaxTotal: withholdingTaxTotal()
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
