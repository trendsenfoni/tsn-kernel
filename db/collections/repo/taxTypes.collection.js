const { taxTotal, withholdingTaxTotal } = require('./partyHelper')
const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			name: { type: String, unique: true },
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
	model.relations = { items: 'taxTypes' }
	return model
}
