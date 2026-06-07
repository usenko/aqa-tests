import { expect } from "@playwright/test";

export default class MyAccountPage {
	constructor(page) {
		this.page = page;
		this.items = page.locator("#account-order-0 ul > li");
		this.totalAmountField = page.locator("#account-order-0 p", {
			hasText: "Total Amount:",
		});
		this.logoutButton = page.locator("[id='account-logout-button']");
	}

	async checkFinalOrder(firstItemPrice, lastItemPrice) {
		const totalPrice =
			Number(firstItemPrice.replace("$", "")) +
			Number(lastItemPrice.replace("$", ""));
		const totalAmount = await this.totalAmountField.innerText();
		console.log(this.totalAmountField, totalPrice);
		await this.page.pause();
		await expect(this.totalAmountField).toContainText(`${totalPrice}`);
	}

	async checkTotalItems() {
		await expect(this.items.first()).toBeVisible();
		await expect(this.items.last()).toBeVisible();
		await expect(this.logoutButton).toBeEnabled();

		//await this.checkTotalItems.last().scrollIntoViewIfNeeded();
		//await this.page.mouse.wheel()(0, 500);
	}

	async logout() {
		await this.logoutButton.click();
		//await expect(this.page).toHaveURL("https://aqa-app.vercel.app/login");
	}
}
