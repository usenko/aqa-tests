import { test } from '@playwright/test'
import { userData } from '../data/testData'
import RegisterPage from '../page-object/Register.page'
import LoginPage from '../page-object/Login.page'

test('Setup: login and save storage state', async ({ page, context }) => {
	const registerPage = new RegisterPage(page)
	const loginPage = new LoginPage(page)

	await test.step('Open login page', async () => {
		await registerPage.openLoginPage()
	})
	await test.step('Register new user', async () => {
		await registerPage.fillRegistrationForm(userData)
	})
	await test.step('Login as registered user', async () => {
		await loginPage.login(userData.email, userData.password)
	})
	await test.step('Save storage state', async () => {
		await context.storageState({ path: 'data/storageState.json' })
	})
})
