# authenticated-fetch

This function can be used to automate fetching fresh access tokens and retrying requests upon receiving an unauthenticated status code 401 response.

The credentials are passed in a react-style reference object, so they can be updated from within the callbacks.

## Examples

### Basic Usage

#### Typescript

```ts
import type {
  AuthenticatedFetchCallback,
  CredentialsRef,
} from "authenticated-fetch";
import authenticatedFetch from "authenticated-fetch";

export type Credentials = string;
export type MyCredentialsRef = CredentialsRef<Credentials>;
export type MyAuthFetchCallback = AuthenticatedFetchCallback<Credentials>;

const requestCallback: MyAuthFetchCallback = async (credentialsRef) => {
  // Make the fetch request and return the response.
  return fetch("https://my-api.com/protected/route", {
    headers: {
      Authorization: `Bearer ${credentialsRef.current}`,
    },
  });
};

const authenticationCallback: MyAuthFetchCallback = async (credentialsRef) => {
  // Make the fetch request.
  const response = await fetch("https://my-api.com/auth/access", {
    method: "POST",
  });
  // If successful, update credentialsRef.current with the new credentials.
  if (response.ok) {
    const json = await response?.json();
    if (json) {
      // In this case, we are looking for an access token on json.data.accessToken.
      credentialsRef.current = json.data?.accessToken;
    }
  }
  // Return the response.
  return response;
};

/**
 * Since this is stored by reference, the credentials updated by
 * one invocation of authenticatedFetch can be used by another.
 */
const credentialsRef: MyCredentialsRef = { current: null };

/**
 * This function will firstly invoke requestCallback.
 *
 * - If requestCallback returns any code other than 401 (unauthorized), its response will be returned.
 * - If requestCallback returns status code 401, then authenticationCallback will be invoked, which should
 * make an attempt to acquire new credentials (e.g. a new access token). If successful, the original
 * request will be attempted once more, and its response returned.
 */
const response = await authenticatedFetch(
  credentialsRef,
  requestCallback,
  authenticationCallback,
);
```

#### Javascript

```js
import authenticatedFetch from "authenticated-fetch";

const requestCallback = async (credentialsRef) => {
  return fetch("https://my-api.com/protected/route", {
    headers: {
      Authorization: `Bearer ${credentialsRef.current}`,
    },
  });
};

const authenticationCallback = async (credentialsRef) => {
  const response = await fetch("https://my-api.com/auth/access", {
    method: "POST",
  });
  if (response.ok) {
    const json = await response?.json();
    if (json) {
      credentialsRef.current = json.data?.accessToken;
    }
  }
  return response;
};

const credentialsRef = { current: null };

const response = await authenticatedFetch(
  credentialsRef,
  requestCallback,
  authenticationCallback,
);
```

### Simplifying Usage

To make this more convenient, you can wrap the call to `authenticatedFetch` in a function to encapsulate your `authenticationCallback` without having to provide it as an argument every time:

#### Typescript

```ts
import type {
  AuthenticatedFetchCallback,
  CredentialsRef,
} from "authenticated-fetch";
import authenticatedFetch from "authenticated-fetch";

export type Credentials = string;
export type MyCredentialsRef = CredentialsRef<Credentials>;
export type MyAuthFetchCallback = AuthenticatedFetchCallback<Credentials>;

const authenticationCallback: MyAuthFetchCallback = async (
  credentialsRef: MyCredentialsRef,
) => {
  const response = await fetch("https://my-api.com/auth/access", {
    method: "POST",
  });
  if (response.ok) {
    const json = await response?.json();
    if (json) {
      credentialsRef.current = json.data?.accessToken;
    }
  }
  return response;
};

export async function myAuthenticatedFetch(
  credentialsRef: MyCredentialsRef,
  requestCallback: MyAuthFetchCallback,
) {
  return authenticatedFetch(
    credentialsRef,
    requestCallback,
    authenticationCallback,
  );
}
```

#### Javascript

```js
import authenticatedFetch from "authenticated-fetch";

const authenticationCallback = async (credentialsRef) => {
  const response = await fetch("https://my-api.com/auth/access", {
    method: "POST",
  });
  if (response.ok) {
    const json = await response?.json();
    if (json) {
      credentialsRef.current = json.data.accessToken;
    }
  }
  return response;
};

export async function myAuthenticatedFetch(credentialsRef, requestCallback) {
  return authenticatedFetch(
    credentialsRef,
    requestCallback,
    authenticationCallback,
  );
}
```
