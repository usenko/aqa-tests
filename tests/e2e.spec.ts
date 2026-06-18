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
test.describe("E2E: order flow", () => {
	test.beforeAll(async ({}) => {
		console.log("Starting E2E tests");
		console.log(`Base URL: ${process.env.BASE_URL}`);
	});
	test.beforeEach(async () => {
		console.log("BeforeEach: ${process.env.UI_BASE_URL}");
	});
	test.afterEach(async ({ page }, testInfo) => {
		if (testInfo.status !== testInfo.expectedStatus) {
			console.log(`afterEach: test failed: ${testInfo.title}`);
			await page.screenshot({
				path: `test-results/$${testInfo.title}-failed.png`,
				fullPage: true,
			});
		}
	});
	test.afterAll(async () => {
		console.log("after ALL: cleanup test data");
	});
	test("Create User, login, order 2 items, payment", async ({ page }) => {
		const registerPage = new RegisterPage(page);
		const loginPage = new LoginPage(page);
		const catalogPage = new CatalogPage(page);
		const checkoutPage = new CheckoutPage(page);
		const myAccountPage = new MyAccountPage(page);
		const basketPage = new BasketPage(page);
		let items;

		await test.step("Open login page", async () => {
			await registerPage.openLoginPage();
		});
		await test.step("Register new user", async () => {
			await registerPage.fillRegistrationForm(userData);
		});
		await test.step("Login as registered user", async () => {
			await loginPage.login(userData.email, userData.password);
		});
		await test.step("Select 2 items", async () => {
			items = await catalogPage.selectProduct();
		});
		await test.step("Verify basket counter(visible, qty)", async () => {
			await expect(catalogPage.basketCount).toBeVisible();
			await expect(catalogPage.basketCount).toContainText("2", {
				timeout: 2000,
			});
		});
		await test.step("Go to basket", async () => {
			await catalogPage.gotoBasket();
		});
		await test.step("Verify product details in basket", async () => {
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
		});

		await test.step("", async () => {
			const firstProductPriceNumber = Number(
				(await basketPage.firstItemPrice.innerText()).replace(
					/\D/g,
					"",
				),
			);
			const secondProductPriceNumber = Number(
				(await basketPage.secondItemPrice.innerText()).replace(
					/\D/g,
					"",
				),
			);
			const totalProductPriceNumber = parseInt(
				(await basketPage.totalValue.innerText()).replace(
					/[^\d.]/g,
					"",
				),
				10,
			);
			expect(totalProductPriceNumber).toBe(
				firstProductPriceNumber + secondProductPriceNumber,
			);
			await basketPage.checkoutButton.waitFor({
				state: "visible",
			});
		});

		await test.step("Go to checkout page", async () => {
			await basketPage.goToCheckoutPage();
		});

		await test.step("Fill payment data and submit payment", async () => {
			await checkoutPage.fillPaymentData(
				cardData.cardNumber,
				cardData.cardDate,
				cardData.cardCVV,
			);
		});

		await test.step("Verify successful order", async () => {
			await expect(checkoutPage.successOrder).toBeVisible({
				timeout: 8000,
			});
			await expect(checkoutPage.page).toHaveURL("/checkout");
		});

		await test.step("Go to my account page", async () => {
			await checkoutPage.goToMyAccount();
			await expect(checkoutPage.page).toHaveURL("/account");
		});

		await test.step("Verify total amount", async () => {
			const totalPrice =
				Number(items.firstProduct.price.replace("$", "")) +
				Number(items.secondProduct.price.replace("$", ""));
			const totalAmount =
				await myAccountPage.totalAmountField.innerText();
			await expect(myAccountPage.totalAmountField).toContainText(
				`${totalPrice}`,
			);
		});

		await test.step("Verify items list", async () => {
			await expect(myAccountPage.items.first()).toBeVisible();
			await expect(myAccountPage.items.last()).toBeVisible();
			await expect(myAccountPage.logoutButton).toBeEnabled();
		});

		//await this.checkTotalItems.last().scrollIntoViewIfNeeded();
		//await this.page.mouse.wheel()(0, 500);
		await test.step("Logout", async () => {
			await myAccountPage.logout();
		});
	});
});
