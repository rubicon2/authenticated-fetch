import { describe, expect, it, vi } from "vitest";
import authenticatedFetch from "./index.mjs";

const successResponse = new Response(null, { status: 200 });
const badRequestResponse = new Response(null, { status: 400 });
const unauthenticatedResponse = new Response(null, { status: 401 });
const unauthorizedResponse = new Response(null, { status: 403 });
const internalErrorResponse = new Response(null, { status: 500 });

describe("authenticatedFetch", () => {
  it("is a function", () => {
    expect(typeof authenticatedFetch).toStrictEqual("function");
  });

  describe.each([
    {
      testType: "status code 200",
      requestCallbackResponse: successResponse,
    },
    {
      testType: "status code 400",
      requestCallbackResponse: badRequestResponse,
    },
    {
      testType: "status code 403",
      requestCallbackResponse: unauthorizedResponse,
    },
    {
      testType: "status code 500",
      requestCallbackResponse: internalErrorResponse,
    },
  ])(
    "given a requestCallback that resolves to a response with $testType",
    ({ requestCallbackResponse }) => {
      it("invokes requestCallback once", async () => {
        const requestCallback = vi.fn(async () => requestCallbackResponse);
        const authenticationCallback = vi.fn(async () => new Response());

        await authenticatedFetch(
          { current: null },
          requestCallback,
          authenticationCallback,
        );

        expect(requestCallback).toHaveBeenCalledTimes(1);
      });

      it("does not invoke the authenticationCallback", async () => {
        const requestCallback = vi.fn(async () => requestCallbackResponse);
        const authenticationCallback = vi.fn(async () => new Response());

        await authenticatedFetch(
          { current: null },
          requestCallback,
          authenticationCallback,
        );

        expect(authenticationCallback).not.toHaveBeenCalled();
      });

      it("returns the response", async () => {
        const requestCallback = vi.fn(async () => requestCallbackResponse);
        const authenticationCallback = vi.fn(async () => new Response());

        const response = await authenticatedFetch(
          { current: null },
          requestCallback,
          authenticationCallback,
        );

        expect(response.status).toStrictEqual(requestCallbackResponse.status);
      });
    },
  );

  describe("given a requestCallback that resolves to a response with status code 401", () => {
    it("invokes authenticationCallback with credentialsRef as an argument", async () => {
      const requestCallback = vi.fn(async () => unauthenticatedResponse);
      const authenticationCallback = vi.fn(async () => new Response());

      const credentialsRef = {
        current: null,
      };

      await authenticatedFetch(
        credentialsRef,
        requestCallback,
        authenticationCallback,
      );

      expect(authenticationCallback).toHaveBeenCalledTimes(1);
      expect(authenticationCallback).toHaveBeenCalledWith(credentialsRef);
    });

    describe("given an authenticationCallback that resolves to a response with status code 200", () => {
      it("invokes the requestCallback a second time and returns the response", async () => {
        const requestCallback = vi
          .fn()
          .mockImplementationOnce(async () => unauthenticatedResponse)
          .mockImplementationOnce(async () => successResponse);
        const authenticationCallback = vi.fn(async () => successResponse);

        const response = await authenticatedFetch(
          { current: null },
          requestCallback,
          authenticationCallback,
        );

        expect(requestCallback).toHaveBeenCalledTimes(2);
        expect(response.status).toStrictEqual(successResponse.status);
      });
    });

    describe.each([
      {
        testType: "status code 400",
        authenticationCallbackResponse: badRequestResponse,
      },
      {
        testType: "status code 401",
        authenticationCallbackResponse: unauthenticatedResponse,
      },
      {
        testType: "status code 403",
        authenticationCallbackResponse: unauthorizedResponse,
      },
      {
        testType: "status code 500",
        authenticationCallbackResponse: internalErrorResponse,
      },
    ])(
      "given an authenticationCallback that resolves to a response with $testType",
      ({ authenticationCallbackResponse }) => {
        it("returns the original requestCallback response without attempting the request a second time", async () => {
          const requestCallback = vi
            .fn()
            .mockImplementationOnce(async () => unauthenticatedResponse);
          const authenticationCallback = vi.fn(
            async () => authenticationCallbackResponse,
          );

          const response = await authenticatedFetch(
            { current: null },
            requestCallback,
            authenticationCallback,
          );

          expect(requestCallback).toHaveBeenCalledTimes(1);
          expect(authenticationCallback).toHaveBeenCalledTimes(1);
          expect(response.status).toStrictEqual(unauthenticatedResponse.status);
        });
      },
    );
  });
});
