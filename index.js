process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const fetch = require('node-fetch')
const FormData = require('form-data')

const data = {}

const JenkinsBaseURL = 'https://example.com/'

//Adapted from https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
async function _get(url, api, sleepTime, attempts, prop) {
  console.log(`Calling ${api} API @`, url)
  try {
    const response = await fetch(url)
    const json = await response.json()
    const objProperty = await json[prop]
    if(!objProperty) {
      if(!attempts) throw new Error(`The ${api} api is not returning ${prop}`)
      attempts -= 1
      await _sleep(sleepTime)
      console.log(`${api} not returning ${prop}. Trying again ${attempts} attempts left`)
      return await _get(url, api, sleepTime, attempts, prop) //tail end recursion
    }
    return objProperty
  } catch (err) {
    console.log(err)
  }
}

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function _sleep(ms) {
  console.log(`Sleeping for ${ms / 1000} seconds`)
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function _triggerBuildReturnLocation (data) {
  const path = 'job/job_name/buildWithParameters'
  const token = '?token='
  const url = encodeURI(JenkinsBaseURL + path + token)
  const formData = new FormData()
  // My Jenkins build requires a file.
  formData.append('file_path/file_name', JSON.stringify(data), 'file_path/file_name')
  // Optional string and Choise params look like below
  // formData.append('ANSIBLE_EXTRA_ARG', '-v')
  // formData.append('ANSIBLE_BRANCH', 'master')
  const location = await _postFormGrabLocation(url, formData)
  return location
}

async function _postFormGrabLocation (url, formData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })
    // Jenkins gives you the url of the Queue in it's headers
    const headers = await response.headers
    const location = await headers.get('location')
    console.log('Build Triggered:', location)
    return location
  } catch (err) {
    console.log(err)
  }
}

async function _getBuildNumberFromQueue(location, attempts = 2) {
  const queueURL = location + 'api/json'
  const executable = await _get(queueURL, 'Queue', 5000, attempts, 'executable')
  return executable && executable.number || 0
}

async function _getBuildStatus(number, attempts = 3) {
  const postFix = 'job/job_name/' + number + '/api/json'
  const finalURL = encodeURI(JenkinsBaseURL + postFix)
  const buildStatus = await _get(finalURL, 'Build', 30000, attempts, 'result')
  console.log(buildStatus)
  return buildStatus
}

// https://javascript.info/async-await
async function run() {
  const location = await _triggerBuildReturnLocation(data)
  await _sleep(8000) // Build ID isn't available immediately
  const number = await _getBuildNumberFromQueue(location)
  await _sleep(30000) // Builds take min 45sec max 95 seconds
  const buildStatus = await _getBuildStatus(number)
  console.log(buildStatus)
  return buildStatus
}

module.exports = {
  _get,
  _getBuildStatus,
  _getBuildNumberFromQueue,
  JenkinsBaseURL,
  _postFormGrabLocation,
  run,
  _sleep,
  _triggerBuildReturnLocation,
}