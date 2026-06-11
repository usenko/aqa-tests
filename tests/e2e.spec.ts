import { test, expect } from "@playwright/test";
import RegisterPage from "../page-object/Register.page";
import LoginPage from "../page-object/Login.page";
import CatalogPage from "../page-object/Catalog.page";
import { userData, cardData } from "../data/testData";
import dotenv from "dotenv";
import BasketPage from "../page-object/Basket.page";
import CheckoutPage from "../page-object/Checkout.page";
import MyAccountPage from "../page-object/MyAccount.page";

dotenv.config({ path: ".env" });

test.setTimeout(60000);
test.describe("End-to-end tests", () => {
	test("", async ({ page }) => {
		const registerPage = new RegisterPage(page);
		const loginPage = new LoginPage(page);
		const catalogPage = new CatalogPage(page);
		const checkoutPage = new CheckoutPage(page);
		const myAccountPage = new MyAccountPage(page);
		const basketPage = new BasketPage(page);

		await registerPage.openLoginPage();
		await registerPage.fillRegistrationForm(userData);
		await loginPage.login(userData.email, userData.password);
		const items = await catalogPage.selectProduct();

		await expect(catalogPage.basketCount).toBeVisible();
		await expect(catalogPage.basketCount).toContainText("2", {
			timeout: 2000,
		});

		await catalogPage.gotoBasket();

		//check products details
		await expect(basketPage.firstProductItem).toHaveText(
			items.secondProduct.name,
		);
		await expect(basketPage.secondProductItem).toHaveText(
			items.firstProduct.name,
		);
		await expect(basketPage.firstItemPrice).toHaveText(
			items.secondProduct.price,
		);
		await expect(basketPage.secondItemPrice).toHaveText(
			items.firstProduct.price,
		);

		const firstProductPriceNumber = Number(
			(await basketPage.firstItemPrice.innerText()).replace(/\D/g, ""),
		);
		const secondProductPriceNumber = Number(
			(await basketPage.secondItemPrice.innerText()).replace(/\D/g, ""),
		);
		const totalProductPriceNumber = parseInt(
			(await basketPage.totalValue.innerText()).replace(/[^\d.]/g, ""),
			10,
		);
		expect(totalProductPriceNumber).toBe(
			firstProductPriceNumber + secondProductPriceNumber,
		);
		await basketPage.checkoutButton.waitFor({ state: "visible" });
		await basketPage.checkTotalPrice();

		await checkoutPage.fillPaymentData(
			cardData.cardNumber,
			cardData.cardDate,
			cardData.cardCVV,
		);

		await expect(checkoutPage.successOrder).toBeVisible({ timeout: 8000 });
		await expect(checkoutPage.page).toHaveURL("/checkout");

		await checkoutPage.goToMyAccount();
		await expect(checkoutPage.page).toHaveURL("/account");

		const totalPrice =
			Number(items.firstProduct.price.replace("$", "")) +
			Number(items.secondProduct.price.replace("$", ""));
		const totalAmount = await myAccountPage.totalAmountField.innerText();
		await expect(myAccountPage.totalAmountField).toContainText(
			`${totalPrice}`,
		);

		await expect(myAccountPage.items.first()).toBeVisible();
		await expect(myAccountPage.items.last()).toBeVisible();
		await expect(myAccountPage.logoutButton).toBeEnabled();

		//await this.checkTotalItems.last().scrollIntoViewIfNeeded();
		//await this.page.mouse.wheel()(0, 500);

		//await myAccountPage.logout();
	});
});
