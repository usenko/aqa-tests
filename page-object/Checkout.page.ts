import { expect } from "@playwright/test";

export default class CheckoutPage {
	constructor(page) {
		this.page = page;
		this.cardNumberField = page.getByPlaceholder("Card Number (16 digits)");
		this.payNowBtn = page.getByRole("button", { name: "Pay Now" });
		this.cardDate = page.getByPlaceholder("MM/YY");
		this.cardCVV = page.getByPlaceholder("CVV (3 digits)");

		this.successOrder = page.locator('[id="checkout-success"]');
		this.myAccountButton = page.locator('[href="/account"]');
	}

	async fillPaymentData(cardNumber, cardDate, cardCVV) {
		await this.cardNumberField.type(cardNumber, { delay: 10 });
		await this.cardNumberField.press("Enter");
		await this.cardDate.fill(cardDate);
		await this.cardCVV.fill(cardCVV);
		await this.payNowBtn.click();
	}

	async successOrderMessage() {
		await expect(this.successOrder).toBeVisible({ timeout: 8000 });
		await expect(this.page).toHaveURL(
			"https://aqa-app.vercel.app/checkout",
		);
	}

	async goToMyAccount() {
		await this.myAccountButton.click();
		await expect(this.page).toHaveURL("https://aqa-app.vercel.app/account");
	}
}
