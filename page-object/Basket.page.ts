import { expect, Locator, Page } from "@playwright/test";
export default class BasketPage {
	constructor(
		page,
		tabletNameValue,
		coffemachineNameValue,
		tabletPriceValue,
		coffemachinePriceValue,
	) {
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

		this.tabletNameValue = tabletNameValue;
		this.coffemachineNameValue = coffemachineNameValue;
		this.tabletPriceValue = tabletPriceValue;
		this.coffemachinePriceValue = coffemachinePriceValue;
	}

	async compareProductDetails() {
		await expect(this.firstProductItem).toHaveText(
			this.coffemachineNameValue,
		);
		await expect(this.secondProductItem).toHaveText(this.tabletNameValue);
		await expect(this.firstItemPrice).toHaveText(
			this.coffemachinePriceValue,
		);
		await expect(this.secondItemPrice).toHaveText(this.tabletPriceValue);
	}

	async checkTotalPrice() {
		const firstProductPriceNumber = Number(
			(await this.firstItemPrice.innerText()).replace(/\D/g, ""),
		);
		const secondProductPriceNumber = Number(
			(await this.secondItemPrice.innerText()).replace(/\D/g, ""),
		);
		const totalProductPriceNumber = parseInt(
			(await this.totalValue.innerText()).replace(/[^\d.]/g, ""),
			10,
		);

		expect(totalProductPriceNumber).toBe(
			firstProductPriceNumber + secondProductPriceNumber,
		);

		await this.checkoutButton.waitFor({ state: "visible" });
		await this.checkoutButton.click();
		await this.page.waitForURL("https://aqa-app.vercel.app/checkout");
	}
}
