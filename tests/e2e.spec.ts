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

		await registerPage.navigate();
		await registerPage.fillRegistrationForm(userData);
		await loginPage.login(userData.email, userData.password);
		await catalogPage.selectProduct();

		const basketPage = new BasketPage(
			page,
			catalogPage.tabletNameValue,
			catalogPage.coffemachineNameValue,
			catalogPage.tabletPriceValue,
			catalogPage.coffemachinePriceValue,
		);
		await basketPage.compareProductDetails();
		await basketPage.checkTotalPrice();

		await checkoutPage.fillPaymentData(
			cardData.cardNumber,
			cardData.cardDate,
			cardData.cardCVV,
		);

		await checkoutPage.successOrderMessage();

		await checkoutPage.goToMyAccount();

		await myAccountPage.checkFinalOrder(
			catalogPage.tabletPriceValue,
			catalogPage.coffemachinePriceValue,
		);
		await myAccountPage.checkTotalItems();
		//await myAccountPage.logout();
	});
});
