export type CredentialsRef<T> = { current: T | null };
export type AuthenticatedFetchCallback<T> = (
  credentialsRef: CredentialsRef<T>,
) => Promise<Response>;

export default async function authenticatedFetch<T>(
  /**
   * Store the authentication details within an object so
   * we can pass by reference. This means it can be updated
   * from within callbacks, and will be persistent between
   * different requests.
   */
  credentialsRef: CredentialsRef<T>,
  /**
   * The request to be fulfilled.
   *
   * If this returns a status code of 401 (i.e. unauthorized),
   * authenticatedFetch will invoke the authentication callback
   * which should try to get fresh credentials. If successful,
   * this callback will be attempted one more time before
   * returning the response.
   */
  requestCallback: AuthenticatedFetchCallback<T>,
  /**
   * A callback that should make a request for new authentication
   * credentials, e.g. a new access token.
   *
   * If successful, it should update credentialsRef.current
   * with the new authentication details. If unsuccessful, then
   * it is probably a good idea to set credentialsRef.current
   * to null so it is easy to tell if credentials are present.
   */
  authenticationCallback: AuthenticatedFetchCallback<T>,
): Promise<Response> {
  let response = await requestCallback(credentialsRef);

  if (response.status === 401) {
    const authenticationResponse = await authenticationCallback(credentialsRef);
    // If successful, repeat the original request with the new credentials.
    if (authenticationResponse.ok) {
      response = await requestCallback(credentialsRef);
    }
  }

  return response;
}
