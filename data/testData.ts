import { faker } from "@faker-js/faker";

export const userData = {
	firstName: faker.person.firstName(),
	lastName: faker.person.lastName(),
	email: faker.internet.email(),
	password: faker.internet.password(),
	city: faker.location.city(),
	country: "Ukraine",
	phoneNumber: "+380637612321",
	streetAddress: faker.location.streetAddress(),
	zipCode: "12345",
};

export const cardData = {
	cardNumber: process.env.CARD_NUMBER,
	cardDate: process.env.CARD_DATE,
	cardCVV: faker.finance.creditCardCVV(),
};

export const apiDataPost = {
	title: "Hello World",
	body: "Test body",
	userId: 1,
};

export const apiDataPatch = {
	title: "Hello AQA World",
};
