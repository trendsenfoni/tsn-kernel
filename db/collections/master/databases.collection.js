const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	const schema = mongoose.Schema(
		{
			owner: { type: ObjectId, ref: 'members', index: true },
			identifier: { type: String, required: true, unique: true },
			name: { type: String, required: true },
			team: [{
				teamMember: { type: ObjectId, ref: 'members', index: true },
				permissions: {}
			}],
			dbHost: { type: String, default: '' },
			dbName: { type: String, default: '' },
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
