
const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			itemGroup: { type: ObjectId, ref: 'itemGroups', required: true, index: true },
			category: { type: ObjectId, ref: 'categories', index: true },
			name: { type: String, unique: true },
			description: { type: String, default: '', index: true },
			keyword: { type: String, default: '', index: true },
			brand: { type: ObjectId, ref: 'brands', default: null, index: true },
			model: { type: ObjectId, ref: 'models', default: null, index: true },
			taxType: { type: ObjectId, ref: 'taxTypes', default: null, index: true },
			exportTaxType: { type: ObjectId, ref: 'taxTypes', default: null, index: true },
			unitCode: { type: String, default: '' },
			buyersItemIdentification: { type: String, default: '', index: true },
			sellersItemIdentification: { type: String, default: '', index: true },
			manufacturersItemIdentification: { type: String, default: '', index: true },
			additionalItemIdentification: [{}],
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
