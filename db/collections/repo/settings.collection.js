const collectionName = path.basename(__filename, '.collection.js')

module.exports = function (dbModel) {
  let schema = mongoose.Schema(
    {
      location: { type: ObjectId, ref: 'locations', default: null, index: true },
      member: { type: ObjectId, ref: 'locations', default: null, index: true },
      value: { type: Object, default: null },
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
  model.relations = {}
  return model
}
