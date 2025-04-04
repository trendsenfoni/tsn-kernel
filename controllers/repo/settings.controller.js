module.exports = (dbModel, sessionDoc, req) =>
	new Promise(async (resolve, reject) => {

		switch (req.method.toUpperCase()) {
			case 'GET':
				getOne(dbModel, sessionDoc, req).then(resolve).catch(reject)

				break
			case 'POST':
			case 'PUT':
				save(dbModel, sessionDoc, req).then(resolve).catch(reject)
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
	return new Promise(async (resolve, reject) => {
		try {
			let dbDoc = await db.databases.findOne({ _id: dbModel._id })
			resolve(dbDoc.settings || {})

		} catch (err) {
			reject(err)
		}

	})
}

function save(dbModel, sessionDoc, req) {
	return new Promise(async (resolve, reject) => {
		try {

			let data = req.body || {}
			delete data._id
			let dbDoc = await db.databases.findOne({ _id: dbModel._id })
			if (!dbDoc) return reject('database not found')
			console.log(`data:`, data)
			const settings = Object.assign(dbDoc.settings, data)
			db.databases.updateOne({ _id: dbDoc._id }, { $set: { settings: settings } })
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
			let dbDoc = await db.databases.findOne({ _id: dbModel._id })
			if (!dbDoc) return reject('database not found')
			dbDoc.settings = {}
			if (!epValidateSync(dbDoc, reject)) return
			doc.save()
				.then(result => resolve(result.settings))
				.catch(reject)
		} catch (err) {
			reject(err)
		}
	})
}
