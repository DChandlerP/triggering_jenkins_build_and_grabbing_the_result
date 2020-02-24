process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fetch = require('node-fetch');
const FormData = require('form-data');

const data = {};

const baseUrl = 'https://example.com/';

function triggerBuild(data) {
  const path = 'job/job_name/buildWithParameters';
  const token = '?token=';
  const url = encodeURI(baseUrl + path + token);
  const formData = new FormData(); //needed for passing arguments
  const file = "/filename"
  formData.append(file, JSON.stringify(data), file,);
  fetch(url, {method: 'POST', body: formData})
    .then(res => getBuildNumber(res.headers.get('location') + '/api/json'))
    .catch((error) => {
      console.error('Error:', error);
    });
}

function getBuildNumber(url) {
  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (json.executable === undefined) {
        setTimeout(() => {
          getBuildNumber(url);
        }, 2000);
      } else {
        const postFix = 'job/job_name/' + json.executable.number + '/api/json';
        getBuildStatus(encodeURI(baseUrl + postFix));
      }
    }).catch((error) => {
    console.error('Error:', error);
  });
}

function getBuildStatus(url) {
  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (json.result === null) {
        setTimeout(() => {
          getBuildStatus(url);
        }, 2000);
      } else {
        return json.result;
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

triggerBuild(data);
