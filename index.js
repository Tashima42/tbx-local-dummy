var globalClient = {
  id: null,
  secret: null,
  countryCode: null,
  endpoints: {
    authorize: null,
    token: null,
    userInfo: null
  }
}
var queryParams = {
  code: null,
  state: null
}

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
const autoCompleteParseTokenHistory = [{}]

main()

function main() {
  loadJsonEditors()
  loadQueryParams()
  loadClient()
  loadAuthorizationCode()
  evaluateSteps()
  autocompleteParseTokenResponse()
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
  evaluateConfigureClient()
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
  if (!state || !savedState || state != savedState) return false
  return true
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
function getToken() {
  document.getElementById("loading-token").style.display = "block";

  fetch(globalClient.endpoints.token, {
    method: 'POST',
    body: `code=${queryParams.code}&client_secret=${globalClient.secret}&client_id=${globalClient.id}&grant_type=authorization_code`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then(async res => {
      const body = await res.json()
      Object.assign(res, { parsedBody: body })

      localStorage.setItem('getTokenBody', JSON.stringify(body))

      updateJsonEditorResponseToken(res)
      updateJsonEditorRequestUserInfo()
      document.getElementById("loading-token").style.display = "none";
      autoCompleteParseTokenHistory.push(body)
      autocompleteParseTokenResponse()
    })
}

function getUserInfo() {
  document.getElementById("loading-userinfo").style.display = "block";

  fetch(globalClient.endpoints.userInfo, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("token")}`
    },
  })
    .then(async res => {
      const body = await res.json()
      Object.assign(res, { parsedBody: body })

      updateJsonEditorResponseUserInfo(res)
      localStorage.setItem('userInfo', JSON.stringify(body))
      document.getElementById("loading-userinfo").style.display = "none";
      evaluateGetUserInfo()
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

function updateJsonEditorResponseToken(response) {
  const json = {
    status: response.status,
    body: response.parsedBody,
    headers: {
      "Content-Type": response.headers.get("Content-Type")
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

function updateJsonEditorResponseUserInfo(response) {
  const json = {
    status: response.status,
    body: response.parsedBody,
    headers: {
      "Content-Type": response.headers.get("Content-Type")
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

function copyTokenResponse() {
  const tokenResponse = JSON.stringify(jsonEditor.token.response.get())
  navigator.clipboard.writeText(tokenResponse);
  showToast("Copied Get Token Response to clipboard")
}

function copyUserInfoCurl() {
  const userInfoCurl = generateUserInfoCurl()
  navigator.clipboard.writeText(userInfoCurl);
  showToast("Copied Get UserInfo CURL to clipboard")
}

function copyUserInfoResponse() {
  const userInfoResponse = JSON.stringify(jsonEditor.userInfo.response.get())
  navigator.clipboard.writeText(userInfoResponse);
  showToast("Copied Get UserInfo Response to clipboard")
}

function initJsonEditor(elementId) {
  const container = document.getElementById(elementId)
  const options = { mode: "code", mainMenuBar: false, statusBar: false }
  const editor = new JSONEditor(container, options)
  editor.aceEditor.setReadOnly(true)
  editor.aceEditor.renderer.setShowGutter(false)
  editor.aceEditor.renderer.setShowPrintMargin(false)
  return editor
}

function showToast(bodyMessage) {
  var toastLiveExample = document.getElementById('liveToast')
  document.getElementById("toast-body").innerText = bodyMessage
  new bootstrap.Toast(toastLiveExample).show()
}



function changeBoxState(boxId, state) {
  document.getElementById(boxId).checked = state
}
function validateString(string) {
  if (!string) return false
  if (typeof string != "string") return false
  if (string.length < 1) return false
  return true
}

function addProblemElementToList({ listId, elementMessage, elementId }) {
  if (document.getElementById(elementId)) return
  const node = document.createElement("li");
  const textnode = document.createTextNode(elementMessage);
  node.classList.add("list-group-item")
  node.appendChild(textnode);
  node.setAttribute('id', elementId)
  document.getElementById(listId).appendChild(node);
}

function removeById(elementId) {
  const element = document.getElementById(elementId)
  if (element) element.remove()
}

function evaluateLogin() {
  const listId = "login-problems"
  let validStep = true
  const validations = [
    {
      elementId: "login-problems-state",
      elementMessage: "Invalid or missing State",
      valid: validateState()
    },
    {
      elementId: "login-problems-code",
      elementMessage: "Missing Authorization Code",
      valid: validateString(queryParams.code)
    },
  ]

  validations.forEach(({ elementMessage, elementId, valid }) => {
    changeProblemsStepInformation({
      valid,
      listId,
      elementId,
      elementMessage,
    })
    if (valid === false) validStep = false
  })

  removeById("login-problems-press")
  changeProblemsValidState({
    problemsSelector: ".login-problems",
    elementId: "login-problems-ok",
    valid: validStep,
    listId,
    checkBoxId: "login-checkbox"
  })
}
function evaluateConfigureClient() {
  const listId = "configure-client-problems"
  let validStep = true
  const validations = [
    {
      elementId: "configure-client-problems-id",
      elementMessage: "Missing Client Id",
      valid: validateString(globalClient.id)
    },
    {
      elementMessage: "Missing Client Secret",
      elementId: "configure-client-problems-secret",
      valid: validateString(globalClient.secret)
    },
    {
      elementMessage: "Missing Client CountryCode",
      elementId: "configure-client-problems-countrycode",
      valid: validateString(globalClient.countryCode),
    },
    {
      elementMessage: "Missing Authorize endpoint",
      elementId: "configure-client-problems-authorize",
      valid: validateString(globalClient.endpoints.authorize)
    },
    {
      elementMessage: "Missing Token endpoint",
      elementId: "configure-client-problems-token",
      valid: validateString(globalClient.endpoints.token)
    },
    {
      elementMessage: "Missing UserInfo endpoint",
      elementId: "configure-client-problems-userinfo",
      valid: validateString(globalClient.endpoints.userInfo)
    },
  ]

  validations.forEach(({ elementMessage, elementId, valid }) => {
    changeProblemsStepInformation({
      valid,
      listId,
      elementId,
      elementMessage
    })
    if (valid === false) validStep = false
  })

  changeProblemsValidState({
    problemsSelector: ".configure-client-problems",
    elementId: "configure-client-problems-ok",
    valid: validStep,
    listId,
    checkBoxId: "configure-client-checkbox"
  })
}
function evaluateGetToken() {
  const token = localStorage.getItem("token")
  const listId = "generate-token-problems"
  let validStep = true
  const validations = [
    {
      elementId: "generate-token-problems-token",
      elementMessage: "Invalid or missing Token",
      valid: validateString(token)
    },
  ]

  validations.forEach(({ elementMessage, elementId, valid }) => {
    changeProblemsStepInformation({
      valid,
      listId,
      elementId,
      elementMessage,
    })
    if (valid === false) validStep = false
  })

  removeById("generate-token-problems-press")
  changeProblemsValidState({
    problemsSelector: ".generate-token-problems",
    elementId: "generate-token-problems-ok",
    valid: validStep,
    listId,
    checkBoxId: "generate-token-checkbox"
  })
}
function evaluateGetUserInfo() {
  const { subscriber_id, country_code } = JSON.parse(localStorage.getItem("userInfo"))

  const listId = "user-info-problems"
  let validStep = true
  const validations = [
    {
      elementId: "user-info-problems-subscriberid",
      elementMessage: "Invalid or missing Subscriber Id",
      valid: validateString(subscriber_id)
    },
    {
      elementId: "user-info-problems-countrycode",
      elementMessage: "Invalid or missing Country Code",
      valid: validateString(country_code)
    },
  ]

  validations.forEach(({ elementMessage, elementId, valid }) => {
    changeProblemsStepInformation({
      valid,
      listId,
      elementId,
      elementMessage,
    })
    if (valid === false) validStep = false
  })

  removeById("user-info-problems-press")
  changeProblemsValidState({
    problemsSelector: ".user-info-problems",
    elementId: "user-info-problems-ok",
    valid: validStep,
    listId,
    checkBoxId: "user-info-checkbox"
  })
}

function changeProblemsStepInformation({ valid, elementMessage, listId, elementId }) {
  if (!valid) {
    addProblemElementToList({
      elementMessage,
      listId,
      elementId
    })
  } else {
    removeById(elementId)
  }
}

function changeProblemsValidState({ problemsSelector, elementId, valid, listId, checkBoxId }) {
  if (valid) {
    addProblemElementToList({
      listId,
      elementMessage: "Everything is OK",
      elementId
    })
    document.querySelector(problemsSelector).style["border-color"] = "blue"
    changeBoxState(checkBoxId, true)
  } else {
    document.querySelector(problemsSelector).style["border-color"] = "red"
    removeById(elementId)
    changeBoxState(checkBoxId, false)
  }
}

function loadJsonEditors() {
  jsonEditor.token.request = initJsonEditor("jsoneditor-request-token")
  jsonEditor.token.response = initJsonEditor("jsoneditor-response-token")
  jsonEditor.userInfo.request = initJsonEditor("jsoneditor-request-userinfo")
  jsonEditor.userInfo.response = initJsonEditor("jsoneditor-response-userinfo")
}

function evaluateSteps() {
  evaluateConfigureClient()
}

function updateParseTokenValue(value) {
  document.getElementById("parse-response-token-result-value").innerText = value
  localStorage.setItem('token', value)
  evaluateGetToken()
}

function updateParseTokenPath(value) {
  document.getElementById("parse-response-token-result-path").innerText = value
}

function getParseTokenPath() {
  return document.getElementById("parse-response-token-result-path").innerText
}

function handleaParseTokenAutocompleteChange() {
  const currentAutocompleteState = getCurrentAutocompleteState()
  const parseResponseTokenInputValue = document.getElementById("parse-response-token-list").value
  const parseResponseTokenInputPath = getParseTokenPath()
  updateParseTokenPath(parseResponseTokenInputPath + "." + parseResponseTokenInputValue)

  autoCompleteParseTokenHistory.push(currentAutocompleteState[parseResponseTokenInputValue])
  document.getElementById("parse-response-token-list").value = ""
  autocompleteParseTokenResponse()
}

function deleteLastParseTokenAutocompleteAction() {
  autoCompleteParseTokenHistory.pop()
  const parseResponseTokenInputPathArray = getParseTokenPath().split(".")
  parseResponseTokenInputPathArray.pop()
  updateParseTokenPath(parseResponseTokenInputPathArray.join("."))
  autocompleteParseTokenResponse()
}

function autocompleteParseTokenResponse() {
  const currentAutocompleteState = getCurrentAutocompleteState()

  if (typeof currentAutocompleteState == "object") {
    clearOptionList()
    loadAutocompleteKeys(currentAutocompleteState)
  } else if (validateString(currentAutocompleteState)) {
    updateParseTokenValue(currentAutocompleteState)
    clearOptionList()
  }

  function loadAutocompleteKeys(keysObject) {
    Object.keys(keysObject).forEach(key => {
      addOptionToList(key)
    })
  }

  function clearOptionList() {
    const node = document.getElementById("parse-response-token-options")
    while (node.firstChild) {
      node.removeChild(node.lastChild);
    }
  }

  function addOptionToList(value) {
    const node = document.createElement("option");
    const textnode = document.createTextNode(value);
    node.appendChild(textnode);
    node.setAttribute('id', "parse-response-token-option")
    document.getElementById("parse-response-token-options").appendChild(node)
  }
}

function getCurrentAutocompleteState() {
  return autoCompleteParseTokenHistory[autoCompleteParseTokenHistory.length - 1]
}
