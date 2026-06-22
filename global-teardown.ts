import fs from 'fs'
export default async function globalTeardown() {
	const filePath = 'data/storageState.json'

	console.log('global teardown: started')

	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath)
		console.log('storageState deleted')
	}
	console.log('global teardown: finished')
}
