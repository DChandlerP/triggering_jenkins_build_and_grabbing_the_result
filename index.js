process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const fetch = require('node-fetch')
const FormData = require('form-data')

const JenkinsURL = 'https://example.com/'

//Adapted from https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
async function _get(url, api, sleepTime, attempts, prop) {
  console.info(`Calling ${api} API @`, url)
  try {
    const response = await fetch(url)
    const json = await response.json()
    const objProperty = await json[prop]
    if(!objProperty) {
      if(!attempts) throw new Error(`The ${api} api is not returning ${prop}`)
      attempts -= 1
      await _sleep(sleepTime)
      return await _get(url, api, sleepTime, attempts, prop) //tail end recursion
    }
    return objProperty
  } catch (err) {
    console.error(err)
  }
}

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
const _sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function _triggerBuildReturnLocation (data) {
  const path = 'job/job_name/buildWithParameters'
  const token = '?token=' //API requires a Token!
  const url = encodeURI(JenkinsURL + path + token)
  const formData = new FormData()
  // My Jenkins build requires a file.
  formData.append('file_path/file_name', JSON.stringify(data), 'file_path/file_name')
  return await _postFormGrabLocation(url, formData)
}

async function _postFormGrabLocation (url, formData) {
  try {
    const response = await fetch(url, { method: 'POST', body: formData })
    return await response.headers.get('location')
  } catch (err) {
    console.error(err)
  }
}

async function _getBuildNumberFromQueue(location, attempts = 2) {
  const queueURL = location + 'api/json'
  const executable = await _get(queueURL, 'Queue', 5000, attempts, 'executable')
  return executable && executable.number
}

async function _getBuildStatus(number, attempts = 3) {
  const postFix = 'job/job_name/' + number + '/api/json'
  const buildURL = encodeURI(JenkinsURL + postFix)
  return await _get(buildURL, 'Build', 30000, attempts, 'result')
}

// Used Async/Await for readability, code reuse, and debugging.
async function run() {
  const location = await _triggerBuildReturnLocation({})
  await _sleep(8000) // Build # isn't available immediately
  const number = await _getBuildNumberFromQueue(location)
  await _sleep(30000) // Builds take min 45sec max 95 seconds
  return await _getBuildStatus(number)
}

console.log(run())

module.exports = {
  _get,
  _getBuildStatus,
  _getBuildNumberFromQueue,
  JenkinsBaseURL: JenkinsURL,
  _postFormGrabLocation,
  run,
  _sleep,
  _triggerBuildReturnLocation,
}