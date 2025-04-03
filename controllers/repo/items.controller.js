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
    dbModel.items
      .findOne({ _id: req.params.param1 })
      .populate([
        {
          path: 'itemGroup',
          populate: [{ path: 'itemMainGroup' }]
        },
        { path: 'category' },
        { path: 'brand' },
        { path: 'model' },
        { path: 'taxType' },
        { path: 'exportTaxType' }
      ])
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
        populate: [
          {
            path: 'itemGroup',
            populate: [{ path: 'itemMainGroup' }]
          },
          { path: 'category' },
          { path: 'brand' },
          { path: 'model' },
          { path: 'taxType' },
          { path: 'exportTaxType' },
        ]
      }
      let filter = {}
      if (req.query.passive != undefined) {
        if (req.query.passive.toString() == 'false') filter.passive = false
        if (req.query.passive.toString() == 'true') filter.passive = true
      }
      if (req.query.itemGroup && req.query.itemGroup != '*') {
        filter.itemGroup = req.query.itemGroup
      } else if (req.query.itemMainGroup) {
        const groupList = (await dbModel.itemGroups.find({ itemMainGroup: req.query.itemMainGroup })).map(e => e._id)
        filter.itemGroup = { $in: groupList }
      }

      if (req.query.category && req.query.category != '*') {
        filter.category = req.query.category
      }
      if (req.query.brand && req.query.brand != '*') {
        filter.brand = req.query.brand
      }
      if (req.query.model && req.query.model != '*') {
        filter.model = req.query.model
      }
      if (req.query.taxType && req.query.taxType != '*') {
        filter.taxType = req.query.taxType
      }
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
          { description: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        ]
      }
      dbModel.items
        .paginate(filter, options)
        .then(resolve).catch(reject)

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
      if (!data.itemGroup) return reject('item group required')
      if (!data.name) return reject('name required')

      const c = await dbModel.items.countDocuments({ name: data.name })
      console.log('c:', c)
      if (c > 0) return reject(`name already exists`)

      const newDoc = new dbModel.items(data)

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

      let doc = await dbModel.items.findOne({ _id: req.params.param1 })
      if (!doc) return reject(`record not found`)

      doc = Object.assign(doc, data)
      if (!epValidateSync(doc, reject)) return
      if (await dbModel.items.countDocuments({ name: doc.name, _id: { $ne: doc._id } }) > 0)
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

      dbModel.items.removeOne(sessionDoc, { _id: req.params.param1 })
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}
