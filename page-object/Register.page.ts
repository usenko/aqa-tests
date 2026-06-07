export default class RegisterPage {
	constructor(page) {
		this.page = page;
		this.registerButton = page.locator("[id='login-register-button']");
		this.firstNameField = page.locator("[id='register-first-name']");
		this.lastNameField = page.locator("[id='register-last-name']");
		this.emailField = page.locator("[id='register-email']");
		this.passwordField = page.locator("[id='register-password']");
		this.cityField = page.locator("[id='register-city']");
		this.countryDropDown = page.locator("[id='register-country']");
		this.phoneField = page.locator("[id='register-phone']");
		this.streetField = page.locator("[id='register-street']");
		this.zipCodeField = page.locator("[id='register-zip']");
		this.submitRegistration = page.locator("[id='register-button']");
	}

	async navigate() {
		await this.page.goto("https://aqa-app.vercel.app/login");
	}

	async fillRegistrationForm(userData) {
		await this.registerButton.click();
		await this.firstNameField.waitFor();
		await this.firstNameField.fill(userData.firstName);
		await this.lastNameField.waitFor();
		await this.lastNameField.fill(userData.lastName);
		await this.emailField.waitFor();
		await this.emailField.fill(userData.email);
		await this.passwordField.waitFor();
		await this.passwordField.fill(userData.password);
		await this.cityField.waitFor();
		await this.cityField.fill(userData.city);
		await this.countryDropDown.waitFor();
		await this.countryDropDown.selectOption(userData.country);
		await this.phoneField.waitFor();
		await this.phoneField.fill(userData.phoneNumber);
		await this.streetField.waitFor();
		await this.streetField.fill(userData.streetAddress);
		await this.zipCodeField.waitFor();
		await this.zipCodeField.fill(userData.zipCode);
		await this.submitRegistration.waitFor();
		await this.submitRegistration.click();
	}
}

// test.describe("End-to-end tests", () => {
// 	test("", async ({ page }) => {
// 		await emailInput.fill("test@example.com");
// 		await registerButton.waitFor();
// 		await registerButton.click();
// 	});
// });
