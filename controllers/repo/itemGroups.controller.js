module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {

    switch (req.method.toUpperCase()) {
      case 'GET':
        if (req.params.param1 != undefined) {
          getOne(dbModel, sessionDoc, req).then(resolve).catch(reject)
        } else {
          getList(dbModel, sessionDoc, req).then(resolve).catch(reject)
        }
        break
      case 'POST':
        post(dbModel, sessionDoc, req).then(resolve).catch(reject)

        break
      case 'PUT':
        put(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      case 'DELETE':
        deleteItem(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      default:
        restError.method(req, reject)
        break
    }
  })

function getOne(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    dbModel.itemGroups
      .findOne({ _id: req.params.param1 })
      .populate('itemMainGroup')
      .then(resolve)
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {
      let options = {
        page: req.query.page || 1,
        limit: req.query.pageSize || 10,
        populate: ['itemMainGroup']
      }
      let filter = {}
      if (req.query.itemMainGroup && req.query.itemMainGroup != '*') filter.itemMainGroup = req.query.itemMainGroup
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
          { article: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        ]
      }
      dbModel.itemGroups
        .paginate(filter, options)
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      let data = req.body || {}
      delete data._id
      if (!data.name) return reject('name required')
      if (!data.itemMainGroup) return reject('main group required')
      const mainGroupDoc = await dbModel.itemMainGroups.findOne({ _id: data.itemMainGroup })
      if (!mainGroupDoc) return reject(`main group not found`)
      const c = await dbModel.itemGroups.countDocuments({ name: data.name })
      if (c > 0) return reject(`name already exists`)

      const newDoc = new dbModel.itemGroups(data)


      if (!epValidateSync(newDoc, reject)) return
      newDoc.save()
        .then(resolve)
        .catch(reject)

    } catch (err) {
      reject(err)
    }

  })
}

function put(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      if (req.params.param1 == undefined) return restError.param1(req, reject)
      let data = req.body || {}
      delete data._id

      let doc = await dbModel.itemGroups.findOne({ _id: req.params.param1 })
      if (!doc) return reject(`record not found`)

      doc = Object.assign(doc, data)
      if (!epValidateSync(doc, reject)) return
      if (await dbModel.itemGroups.countDocuments({ name: doc.name, _id: { $ne: doc._id } }) > 0)
        return reject(`name already exists`)

      doc.save()
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}

function deleteItem(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.params.param1 == undefined) return restError.param1(req, reject)

      dbModel.itemGroups.removeOne(sessionDoc, { _id: req.params.param1 })
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}
