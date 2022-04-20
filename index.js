var globalClient
var queryParams

main()

function main() {
  loadClient()
  loadQueryParams()
  validateState()
  loadAuthorizationCode()
}

function loadQueryParams() {
  const params = new URLSearchParams(window.location.search)
  queryParams = paramsToObject(params)

  function paramsToObject(entries) {
    const result = {}
    for (const [key, value] of entries) {
      result[key] = value
    }
    return result
  }
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

function validateState() {
  const state = queryParams.state
  const savedState = localStorage.getItem("state")
  if (!state || !savedState) return
  if (state != savedState) alert("invalid state")
}

function loadAuthorizationCode() {
  const code = queryParams.code
  if (code) document.querySelector("#code").innerHTML = code
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
function generateToken() {

  fetch(globalClient.endpoints.token, {
    method: 'POST',
    body: `code=${queryParams.code}&client_secret=${globalClient.secret}&client_id=${globalClient.id}&grant_type=authorization_code`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then(res => res.json())
    .then(res => {
      token = res.access_token
      tokenType = res.token_type
      refreshToken = res.refresh_token
      localStorage.setItem("token", token)
      document.getElementById('token').innerText = token
    })
}

function getUserInfo() {

  fetch(globalClient.endpoints.userInfo, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("token")}`
    },
  })
    .then(res => res.json())
    .then(res => {
      subscriber_id = res.subscriber_id
      country_code = res.country_code
      document.getElementById('subscriber_id').innerText = subscriber_id
      document.getElementById('country_code').innerText = country_code
    })
}
