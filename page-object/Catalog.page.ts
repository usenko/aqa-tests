import { Locator, Page } from "@playwright/test";
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
	}

	async selectProduct() {
		await this.coffemachineProduct.click({ delay: 500 });
		await this.tabletProduct.click({ delay: 500 });
		await this.page.waitForLoadState("networkidle");
		await this.basketCount.waitFor();

		const itemsInfo = await this.getProductInfo();
		return itemsInfo;
	}

	async gotoBasket() {
		await this.basketCount.click();
	}

	async getProductInfo() {
		return {
			firstProduct: {
				name: await this.tabletName.innerText(),
				price: await this.tabletPrice.innerText(),
			},
			secondProduct: {
				name: await this.coffemachineName.innerText(),
				price: await this.coffemachinePrice.innerText(),
			},
		};
	}
}
