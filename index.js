var globalClient = null
var queryParams = null

var jsonEditor = {
  token: {
    request: null,
    response: null,
  },
  userInfo: {
    request: null,
    response: null,
  }
}

main()



function main() {
  loadJsonEditors()
  loadQueryParams()
  loadClient()
  validateState()
  loadAuthorizationCode()
}

function loadJsonEditors() {
  jsonEditor.token.request = initJsonEditorRequestToken()
  jsonEditor.token.response = initJsonEditorResponseToken()
  jsonEditor.userInfo.request = initJsonEditorRequestUserInfo()
  jsonEditor.userInfo.response = initJsonEditorResponseUserInfo()
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
  
  updateJsonEditorRequestToken()
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
  const currentUrl = window.location.href.split("?")[0].split("#")[0]
  const query = {
    redirect_uri: currentUrl,
    failureRedirect: currentUrl,
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
  if (code) document.querySelector("#code").value = code
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
      // TODO: expires 
      localStorage.setItem("token", token)
      document.getElementById('token').value = token

      updateJsonEditorResponseToken({token, tokenType, refreshToken})
      updateJsonEditorRequestUserInfo()
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
      document.getElementById('subscriberIdInput').value = subscriber_id
      document.getElementById('subscriberCountryCodeInput').value = country_code

      updateJsonEditorResponseUserInfo({subscriber_id, country_code})
    })
}

function updateJsonEditorRequestToken() {
  const json = {
    url: globalClient.endpoints.token,
    body: `code=${queryParams.code}&client_secret=${globalClient.secret}&client_id=${globalClient.id}&grant_type=authorization_code`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
  jsonEditor.token.request.set(json)   
}

function updateJsonEditorResponseToken({token, tokenType, refreshToken}) {
  const json = {
    body: {
      token,
      tokenType,
      refreshToken
    },
    headers: {
      'Content-Type': 'application/json',
    },
  }
  jsonEditor.token.response.set(json)   
}

function updateJsonEditorRequestUserInfo() {
  const json = {
    url: globalClient.endpoints.token,
    body: `code=${queryParams.code}&client_secret=${globalClient.secret}&client_id=${globalClient.id}&grant_type=authorization_code`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
  jsonEditor.userInfo.request.set(json)   
}

function updateJsonEditorResponseUserInfo({subscriber_id, country_code}) {
  const json = {
    body: {
      subscriber_id,
      country_code
    },
    headers: {
      'Content-Type': 'application/json',
    },
  }
  jsonEditor.userInfo.response.set(json)   
}

function generateTokenCurl() {
  const baseUrl = globalClient.endpoints.token
  const clientId = globalClient.id
  const clientSecret = globalClient.secret
  const code = queryParams.code
  return `curl --location --request POST '${baseUrl}' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'client_id=${clientId}' \
  --data-urlencode 'client_secret=${clientSecret}' \
  --data-urlencode 'grant_type=code' \
  --data-urlencode 'code=${code}'`
}

function generateUserInfoCurl() {
  const baseUrl = globalClient.endpoints.userInfo
  const token = localStorage.getItem('token')
  return `curl --location --request GET '${baseUrl}' \
  --header 'Authorization: Bearer ${token}'` 
}

function copyTokenCurl() {
  const tokenCurl = generateTokenCurl()
  navigator.clipboard.writeText(tokenCurl);
  showToast("Copied Get Token CURL to clipboard")
}

function copyUserInfoCurl() {
  const userInfoCurl = generateUserInfoCurl()
  navigator.clipboard.writeText(userInfoCurl);
  showToast("Copied Get UserInfo CURL to clipboard")
}

function initJsonEditorRequestToken() {
  const container = document.getElementById("jsoneditor-request-token")
  const options = {mode: "code", mainMenuBar: false}
  const editor = new JSONEditor(container, options)
  editor.aceEditor.setReadOnly(true)
  return editor
}
function initJsonEditorResponseToken() {
  const container = document.getElementById("jsoneditor-response-token")
  const options = {mode: "code", mainMenuBar: false}
  const editor = new JSONEditor(container, options)
  editor.aceEditor.setReadOnly(true)
  return editor
}
function initJsonEditorRequestUserInfo() {
  const container = document.getElementById("jsoneditor-request-userinfo")
  const options = {mode: "code", mainMenuBar: false}
  const editor = new JSONEditor(container, options)
  editor.aceEditor.setReadOnly(true)
  return editor
}
function initJsonEditorResponseUserInfo() {
  const container = document.getElementById("jsoneditor-response-userinfo")
  const options = {mode: "code", mainMenuBar: false}
  const editor = new JSONEditor(container, options)
  editor.aceEditor.setReadOnly(true)
  return editor
}

function showToast(bodyMessage) {
  var toastLiveExample = document.getElementById('liveToast')
  document.getElementById("toast-body").innerText = bodyMessage
  new bootstrap.Toast(toastLiveExample).show()
}