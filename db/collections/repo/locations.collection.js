const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			type: { type: String, required: true, enum: ['warehouse', 'shop', 'office', 'factory', 'other'] },
			name: { type: String, unique: true },
			article: { type: String, default: '', index: true },
			subLocations: [{
				code: { type: String, required: true, index: true },
				passive: { type: Boolean, default: false, index: true }
			}],
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
	model.relations = { items: 'category', brands: 'category', models: 'category' }
	return model
}
