const { updateOrder } = require('./bizdoc-helper')
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
    dbModel.orders
      .findOne({ _id: req.params.param1 })
      .populate([{
        path: 'firm',

      }])
      .then(async doc => {
        if (!doc) return reject('order document not found')
        let obj = doc.toJSON()
        obj.lines = await dbModel.orderLines.find({ order: doc._id })
        resolve(obj)
      })
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    let options = {
      page: req.query.page || 1,
      limit: req.query.pageSize || 10,
      populate: ['firm']
    }
    let filter = {}
    if (req.query.closed != undefined) {
      if (req.query.closed.toString() == 'false') filter.closed = false
      if (req.query.closed.toString() == 'true') filter.closed = true
    }
    if (req.query.firm)
      filter.firm = req.query.firm

    if (req.query.type)
      filter.type = req.query.type

    if (req.query.startDate && req.query.endDate) {
      filter.issueDate = { $gte: req.query.startDate, $lte: req.query.endDate }
    } else if (req.query.startDate && !req.query.endDate) {
      filter.issueDate = { $gte: req.query.startDate }
    } else if (!req.query.startDate && req.query.endDate) {
      filter.issueDate = { $lte: req.query.endDate }
    }


    if (req.query.search) {
      filter.$or = [
        { documentNumber: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.streetName': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.buildingName': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.citySubdivisionName': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.cityName': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.region': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.district': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'address.country.name': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
      ]
    }

    dbModel.orders
      .paginate(filter, options)
      .then(resolve).catch(reject)
  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      let data = req.body || {}
      delete data._id
      if (!data.draft) {
        if (!data.firm) return reject('firm required')
        if (!data.type) return reject('ioType required')
        if (!data.issueDate) return reject('issueDate required')
        if (!data.documentNumber) return reject('documentNumber required')
        let firmDoc = await dbModel.firms.findOne({ _id: data.firm })
        if (!firmDoc) return reject(`firm not found`)
        if (await dbModel.orders.countDocuments({
          documentNumber: data.documentNumber
        }) > 0) return reject(`name already exists`)
      }




      const newDoc = new dbModel.orders(data)

      if (!epValidateSync(newDoc, reject)) return

      newDoc.save()
        .then(async newDoc => {
          await updateOrder(dbModel, newDoc._id)
          const doc = await dbModel.orders.findOne({ _id: newDoc._id })
          resolve(doc)
        })
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

      let doc = await dbModel.orders.findOne({ _id: req.params.param1 })
      if (!doc) return reject(`record not found`)

      doc = Object.assign(doc, data)
      if (!data.draft) {
        if (!data.firm) return reject('firm required')
        if (!data.issueDate) return reject('issueDate required')
        if (!data.documentNumber) return reject('documentNumber required')
        let firmDoc = await dbModel.firms.findOne({ _id: data.firm })
        if (!firmDoc) return reject(`firm not found`)
        if (await dbModel.orders.countDocuments({
          documentNumber: data.documentNumber, _id: { $ne: doc._id }
        }) > 0) return reject(`name already exists`)
      }
      if (!epValidateSync(doc, reject)) return

      doc.save()
        .then(async newDoc => {
          await updateOrder(dbModel, newDoc._id)
          const doc = await dbModel.orders.findOne({ _id: newDoc._id })
          resolve(doc)
        })
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

      if (await dbModel.orderLines.countDocuments({ order: req.params.param1 }) > 0) {
        await dbModel.orderLines.removeOne(sessionDoc, { order: req.params.param1 })
      }

      dbModel.orders.removeOne(sessionDoc, { _id: req.params.param1 })
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}
