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
    dbModel.taxTypes
      .findOne({ _id: req.params.param1 })
      .then(resolve)
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    let options = {
      page: req.query.page || 1,
      limit: req.query.pageSize || 10
    }
    let filter = {}
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { article: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
      ]
    }
    dbModel.taxTypes
      .paginate(filter, options)
      .then(resolve)
      .catch(reject)

  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      let data = req.body || {}
      delete data._id
      if (!data.name) return reject('name required')

      const c = await dbModel.taxTypes.countDocuments({ name: data.name })
      if (c > 0) return reject(`name already exists`)

      const newDoc = new dbModel.taxTypes(data)


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

      let doc = await dbModel.taxTypes.findOne({ _id: req.params.param1 })
      if (!doc) return reject(`record not found`)
      doc = Object.assign(doc, data)
      // doc.taxTotal = data.taxTotal
      // doc.withholdingTaxTotal = []
      // if (Array.isArray(data.withholdingTaxTotal)) {
      //   doc.withholdingTaxTotal = data.withholdingTaxTotal.map(e => e)
      // }
      // doc.withholdingTaxTotal = data.withholdingTaxTotal
      console.log(`data:`, data)
      console.log(`doc:`, doc)

      if (!epValidateSync(doc, reject)) return
      if (await dbModel.taxTypes.countDocuments({ name: doc.name, _id: { $ne: doc._id } }) > 0)
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

      dbModel.taxTypes.removeOne(sessionDoc, { _id: req.params.param1 })
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}
