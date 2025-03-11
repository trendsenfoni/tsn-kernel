const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			itemType: { type: ObjectId, ref: 'itemTypes', default: null, index: true },
			itemQuality: { type: ObjectId, ref: 'itemQualities', default: null, index: true },
			name: { type: String, unique: true },
			description: { type: String, default: '' },
			vatRate: { type: Number, default: 0 },
			withHoldingTaxRate: { type: Number, default: 0 },
			unit: { type: String, default: '' },
			passive: { type: Boolean, default: false, index: true }
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
