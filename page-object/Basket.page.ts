import { expect, Locator, Page } from "@playwright/test";
export default class BasketPage {
	constructor(page) {
		this.page = page;
		this.firstProductItem = page.locator("[id='cart-item-name-6']");
		this.secondProductItem = page.locator("[id='cart-item-name-5']");

		this.firstItemPrice = page.locator("[id='cart-item-price-6']");
		this.secondItemPrice = page.locator("[id='cart-item-price-5']");

		this.totalValue = page.locator("[id='cart-total']");
		this.checkoutButton = page.locator("[id='cart-checkout-button']");

		this.addFirstIItemButton = page.locator("[id='cart-item-increase-6']");
		this.removeFirstItemButton = page.locator(
			"[id='cart-item-decrease-6']",
		);
	}

	async checkTotalPrice() {
		await this.checkoutButton.click();
		await this.page.waitForURL("/checkout");
	}
}
