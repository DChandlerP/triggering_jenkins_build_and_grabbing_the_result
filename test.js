const main = require ('./index.js')
const FormData = require('form-data')

test('JenkinsBaseURL is correct', () => {
  expect(main.JenkinsBaseURL).toEqual('https://example.com/');
})

test('function get exists', () => {
  expect(typeof main._get).toEqual('function')
})

test('function createStorageAllocation exists', () => {
  expect(typeof main.run).toEqual('function')
})
test('function sleep exists', () => {
  expect(typeof main._sleep).toEqual('function')
})

test('function getBuildStatus exists', () => {
  expect(typeof main._getBuildStatus).toEqual('function')
})

test('function _getBuildNumberFromQueue exists', () => {
  expect(typeof main._getBuildNumberFromQueue).toEqual('function')
})

test('function _postFormGrabLocation', () => {
  expect(typeof main._postFormGrabLocation).toEqual('function')
})
test('function _triggerBuildReturnLocation', () => {
  expect(typeof main._triggerBuildReturnLocation).toEqual('function')
})

describe('testing APIs', () => {
  beforeEach(() => {
    fetch.resetMocks()
  })

  it('get() returns data', () => {
    const api = 'API'
    const attempts = 2
    const prop = 'data'
    const sleeptime = 10
    const url = main.JenkinsBaseURL
    fetch.mockResponseOnce(JSON.stringify({ data: '12345' }))

    // assert on the response
    main._get(url, api, sleeptime, attempts, prop).then(res => {
      expect(res).toEqual('12345')
    })

    // assert on the times called and arguments given to fetch
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual(main.JenkinsBaseURL)
  })

  it('postFormGrabLocation POSTS', () => {
    const path = 'job/job_name/buildWithParameters'
    const token = '?token=icecream'
    const url = encodeURI(main.JenkinsBaseURL + path + token)
    const formData = new FormData()
    const data = { data: '1234' }
    formData.append('name.yml',
      JSON.stringify(data), 'name.yml')

    fetch.mockResponseOnce(url)
    main._postFormGrabLocation(url, formData)


    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual(url)
    expect(fetch.mock.calls[0][1].method).toEqual('POST')
  })

  it('get handles error', () => {
    const api = 'API'
    const attempts = 2
    const prop = 'data'
    const sleeptime = 10
    const url = main.JenkinsBaseURL
    fetch.mockReject(new Error('fake error message'))
    return (
      main._get(url, api, sleeptime, attempts, prop)
        .then(res => {
          expect(res).toBeFalsy()
        })
    )
  })

  it('postFormGrabLocation handles error', () => {
    const path = 'job/job_name/buildWithParameters'
    const token = '?'
    const url = encodeURI(main.JenkinsBaseURL + path + token)
    const formData = new FormData()
    const data = { data: '1234' }
    formData.append('name.yml',
      JSON.stringify(data), 'name.yml')
    fetch.mockReject(new Error('fake error message'))
    return (
      main._postFormGrabLocation(url, formData)
        .then(res => {
          expect(res).toBeFalsy()
        })
    )
  })
})