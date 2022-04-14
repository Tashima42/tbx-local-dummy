var globalClient

main()

function main() {
  loadClient()
}

function loadClient() {
  const clientRaw = localStorage.getItem("client")
  if (!clientRaw) return
  const client = JSON.parse(clientRaw)
  globalClient = client

  if (client.endpoints) {
    if (client.endpoints.authorize && client.endpoints.authorize.length > 0)
      document.querySelector("#clientAuthorizeInput").value = client.endpoints.authorize
    if (client.endpoints.token && client.endpoints.token.length > 0)
      document.querySelector("#clientTokenInput").value = client.endpoints.token
    if (client.endpoints.userInfo && client.endpoints.userInfo.length > 0)
      document.querySelector("#clientUserInfoInput").value = client.endpoints.userInfo
  }
  if (client.id && client.id.length > 0)
    document.querySelector("#clientIdInput").value = client.id
  if (client.secret && client.secret.length > 0)
    document.querySelector("#clientSecretInput").value = client.secret
  if (client.countryCode && client.countryCode.length > 0)
    document.querySelector("#clientCountrySelect").value = client.countryCode
}

function saveClient() {
  const client = {
    endpoints: {
      authorize: document.querySelector("#clientAuthorizeInput").value,
      token: document.querySelector("#clientTokenInput").value,
      userInfo: document.querySelector("#clientUserInfoInput").value,
    },
    id: document.querySelector("#clientIdInput").value,
    secret: document.querySelector("#clientSecretInput").value,
    countryCode: document.querySelector("#clientCountrySelect").value
  }
  localStorage.setItem("client", JSON.stringify(client))
  loadClient()
}

function redirectToLogin() {
  const query = {
    redirect_uri: window.location.href,
    failureRedirect: window.location.href,
    country: globalClient.countryCode,
    response_type: "code",
    client_id: globalClient.id,
    state: generateState(),
  }
  const authorizeRedirect = globalClient.endpoints.authorize + stringifyQueryObject(query)
  window.location.href = authorizeRedirect
}

function stringifyQueryObject(queryObject) {
  let query = "?"
  for (key in queryObject) {
    query += `${key}=${queryObject[key]}&`
  }
  return query
}

function generateState() {
  const state = generateRandomString(20)
  localStorage.setItem("state", state)
  return state
}

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
function onClick() {

  fetch('/oauth/token', {
    method: 'POST',
    body: `code=${code}&client_secret=${secret}&client_id=${id}&grant_type=authorization_code`, // this is how we send that data up
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',  // This is REALLY important
    },
  })
    .then(res => res.json())
    .then(res => {
      console.log('Credentials', res)
      token = res.access_token
      tokenType = res.token_type
      refreshToken = res.refresh_token
      document.getElementById('token').innerText = token
      document.getElementById('refresh_token').innerText = refreshToken
    })
}
