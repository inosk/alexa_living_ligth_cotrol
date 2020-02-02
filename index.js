const ssm = new (require('aws-sdk/clients/ssm'))();
const ENDPOINT = "living-light-endpoint";

// main handler
exports.handler = async(event, context, callback) => {
  switch(event.directive.header.namespace) {
    case 'Alexa.Discovery':
      callback(null, handleDiscovery(event))
      break
    case 'Alexa.PowerController':
      callback(null, await handlePowerControl(event))
      break
  }
};

async function getSsmParam(key, decrypted = false) {
  const param = await ssm.getParameter({
    Name: key,
    WithDecryption: decrypted
  }).promise();
  return param.Parameter.Value;
}

// request to ifttt
async function requestIfttt(key) {
  const https = require("https");
  const iftttKey = await getSsmParam('ifttt_key', true);
  return new Promise((resolve, reject) => {
    https.get(
      `https://maker.ifttt.com/trigger/${key}/with/key/${iftttKey}`,
      res => resolve(res.statusCode)
    ).on("error", e => reject(e));
  })
}

function handleDiscovery(event) {
  const payload = {
    "endpoints":
    [
      {
        "endpointId": ENDPOINT,
        "manufacturerName": "ほげ",
        "friendlyName": "電気",
        "description": "リビングの電気のスイッチ",
        "displayCategories": ["SWITCH"],
        "capabilities": [
          {
            "type": "AlexaInterface",
            "interface": "Alexa",
            "version": "3"
          },
          {
            "interface": "Alexa.PowerController",
            "version": "3",
            "type": "AlexaInterface",
            "properties": {
              "supported": [
                {
                  "name": "powerState"
                }
              ],
              "retrievable": true
            }
          }
        ]
      }
    ]
  };
  let header = event.directive.header;
  header.name = 'Discover.Response';
  header.messageId = header.messageId;
  const responseEvent = {
    event: {
      header: header,
      payload: payload
    }
  };
  console.log("DEBUG", "Discovery.Response: ", JSON.stringify(responseEvent))
  return (responseEvent);
}

async function handlePowerControl(event, context) {
  const requestMethod = event.directive.header.name;
  const responseHeader = event.directive.header;

  let requestResult;
  let powerResult;

  if (requestMethod === "TurnOn") {
    const key = await getSsmParam('ifttt_living_light_on');
    requestResult = await requestIfttt(key);
    powerResult = "ON";
  }
  else if (requestMethod === "TurnOff") {
    const key = await getSsmParam('ifttt_living_light_off');
    requestResult = await requestIfttt(key);
    powerResult = "OFF";
  }
  else {
    console.log("unsupported method: ", requestMethod)
  };

  if (requestResult !== 200) {
    return;
  }

  responseHeader.namespace = "Alexa";
  responseHeader.name = "Response";
  responseHeader.messageId = responseHeader.messageId + "-R";

  const response = {
    context: {
      "properties": [{
        "namespace": "Alexa.PowerController",
        "name": "powerState",
        "value": powerResult,
        "timeOfSample": (new Date()).toISOString(),
        "uncertaintyInMilliseconds": 50
      }]
    },
    event: {
      header: responseHeader,
      endpoint: {
        scope: {
          type: "BearerToken",
          token: event.directive.endpoint.scope.token
        },
        endpointId: ENDPOINT
      },
      payload: {}
    }
  }
  console.log(response);
  return(response);
}

