import { test, expect } from "@playwright/test";
import { apiDataPost, apiDataPatch } from "../data/testData";

test.describe("API project", () => {
	test("should return 200 status code for GET request", async ({
		request,
	}) => {
		const response = await request.get("/posts/1");
		expect(response.status()).toBe(200);
		const body = await response.json();
		console.log(body);
	});

	test("Get posts", async ({ request }) => {
		const response = await request.post("/posts", {
			data: apiDataPost,
			headers: {
				"Content-type": "application/json; charset=UTF-8",
			},
		});
		expect(response.status()).toBe(201);
		const body = await response.json();
		console.log(body);
	});

	test.only("Patch posts", async ({ request }) => {
		const response = await request.patch("/posts/1", {
			data: apiDataPatch,
		});
		const body = await response.json();

		expect(response.status()).toBe(200);
		expect(body.title).toBe(apiDataPatch.title);
		console.log(body);
	});
});
