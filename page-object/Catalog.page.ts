import { expect, Locator, Page } from "@playwright/test";
export default class CatalogPage {
	page: Page;
	coffemachineProduct: Locator;
	tabletProduct: Locator;
	basketCount: Locator;

	constructor(page: Page) {
		this.page = page;
		this.coffemachineProduct = page.locator("[id='product-add-6']");
		this.tabletProduct = page.locator("[id='product-add-5']");
		this.basketCount = page.locator("[id='cart-count']");

		this.tabletName = page.locator("[id='product-name-5']");
		this.coffemachineName = page.locator("[id='product-name-6']");

		this.tabletPrice = page.locator("[id='product-price-5']");
		this.coffemachinePrice = page.locator("[id='product-price-6']");

		this.tabletNameValue = "";
		this.coffemachineNameValue = "";
		this.tabletPriceValue = "";
		this.coffemachinePriceValue = "";
	}

	async selectProduct() {
		await this.coffemachineProduct.click({ delay: 500 });
		await this.tabletProduct.click({ delay: 500 });
		await this.page.waitForLoadState("networkidle");
		await this.basketCount.waitFor();
		await expect(this.basketCount).toContainText("2", { timeout: 2000 });
		await this.saveProductInfo();
		await this.basketCount.click();
	}

	async saveProductInfo() {
		this.tabletPriceValue = await this.tabletPrice.innerText();
		this.coffemachinePriceValue = await this.coffemachinePrice.innerText();
		this.tabletNameValue = await this.tabletName.innerText();
		this.coffemachineNameValue = await this.coffemachineName.innerText();
	}
}
